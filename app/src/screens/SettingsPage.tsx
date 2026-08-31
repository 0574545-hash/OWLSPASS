import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, ShieldCheck, ShieldPlus, UserPlus } from 'lucide-react'
import { Page } from '../components/AppShell'
import { Checkbox, ListFoot, PageHead, PhoneField, Pill, SubTabs, TextField } from '../components/ui'
import { clock, plural } from '../lib/format'
import { actions, cashJournal, useCan, useStore, type DataMode } from '../state/store'
import { ALL_PERMISSION_IDS, PERMISSION_SECTIONS, permissionsOfSection } from '../domain/permissions'
import type { AccessRights, PaymentSettings, Requisites } from '../domain/types'

type TabId = 'users' | 'roles' | 'requisites' | 'payments' | 'notifications'

const TABS: { id: TabId; label: string }[] = [
  { id: 'users', label: 'Пользователи' },
  { id: 'roles', label: 'Должности' },
  { id: 'requisites', label: 'Реквизиты' },
  { id: 'payments', label: 'Касса и оплата' },
  { id: 'notifications', label: 'Уведомления' },
]

/** Screens 24 and 26–29 — «Настройки» with its five tabs.
 *  `tab` задаётся явно там, где адрес занят карточкой (окно должности). */
export function SettingsPage({ tab: forcedTab }: { tab?: TabId } = {}) {
  const { tab: routeTab } = useParams()
  const navigate = useNavigate()
  const tab = (forcedTab ?? routeTab ?? 'users') as TabId

  const users = useStore((s) => s.users)
  const roles = useStore((s) => s.roles)
  const notifications = useStore((s) => s.notifications)
  const shift = useStore((s) => s.shift)

  // Вкладка, на которую нет права, не показывается и не открывается.
  const allowed: Record<TabId, boolean> = {
    users: useCan('settings.usersView'),
    roles: useCan('settings.roles'),
    requisites: useCan('settings.requisites'),
    payments: useCan('settings.payments'),
    notifications: useCan('settings.notifications'),
  }

  const subtitle: Record<TabId, string> = {
    users: `Центр «Аква пати» · ${users.length} ${plural(users.length, 'пользователь', 'пользователя', 'пользователей')} · ${roles.length} ${plural(roles.length, 'должность', 'должности', 'должностей')}`,
    roles: `Должности · ${roles.length} ${plural(roles.length, 'роль', 'роли', 'ролей')} · ${users.length} ${plural(users.length, 'пользователь', 'пользователя', 'пользователей')}`,
    requisites: 'Реквизиты · последнее изменение 12.08.2026',
    payments: `Касса и оплата · смена открыта в ${clock(shift.openedAt)}, кассир ${shift.cashier}`,
    notifications: `Уведомления · ${notifications.filter((n) => n.enabled).length} ${plural(notifications.filter((n) => n.enabled).length, 'сценарий', 'сценария', 'сценариев')} включено`,
  }

  return (
    <Page>
      <PageHead title="Настройки" subtitle={subtitle[tab]} />

      <SubTabs
        active={tab}
        onChange={(id) => navigate(id === 'users' ? '/settings' : `/settings/${id}`)}
        style={{ marginBottom: 20 }}
        tabs={TABS.filter((t) => allowed[t.id]).map((t) => ({
          id: t.id,
          label: t.label,
          badge:
            t.id === 'users' ? users.length : t.id === 'roles' ? roles.length : undefined,
        }))}
      />

      {!allowed[tab] && (
        <div className="surface">
          <div className="empty">На этот раздел настроек у вашей должности нет прав.</div>
        </div>
      )}
      {allowed[tab] && tab === 'users' && <UsersTab />}
      {allowed[tab] && tab === 'roles' && <RolesTab />}
      {allowed[tab] && tab === 'requisites' && <RequisitesTab />}
      {allowed[tab] && tab === 'payments' && <PaymentsTab />}
      {allowed[tab] && tab === 'notifications' && <NotificationsTab />}
    </Page>
  )
}

function UsersTab() {
  const navigate = useNavigate()
  const users = useStore((s) => s.users)
  const mayEditUsers = useCan('settings.usersEdit')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1, minHeight: 0 }}>
      <div className="surface" data-compact="" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-1)',
          }}
        >
          <div className="card-kicker">Пользователи</div>
          {mayEditUsers && (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/settings/users/new')}>
              <UserPlus />
              Добавить
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 220 }}>ФИО</th>
                <th style={{ width: 150 }}>Должность</th>
                <th style={{ width: 140 }}>Телефон</th>
                <th style={{ width: 120 }}>Смена</th>
                <th style={{ width: 220 }}>Доступ</th>
                <th style={{ width: 110 }}>Статус</th>
                <th style={{ width: 88 }} />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="row-click" onClick={() => navigate(`/settings/users/${u.id}`)}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.fullName}</div>
                  </td>
                  <td>{u.role}</td>
                  <td className="mono">{u.phone}</td>
                  <td>{u.schedule}</td>
                  <td>{u.accessSummary || summarise(u.access)}</td>
                  <td>
                    {u.status === 'disabled' ? (
                      <Pill tone="neutral">Отключён</Pill>
                    ) : u.presence === 'in-shift' ? (
                      <Pill tone="success">В смене</Pill>
                    ) : u.presence === 'invited' ? (
                      <Pill tone="warn">Приглашён</Pill>
                    ) : (
                      <Pill tone="neutral">Не в смене</Pill>
                    )}
                  </td>
                  <td>
                    <div className="cell-actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/settings/users/${u.id}`)
                        }}
                      >
                        Права
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function summarise(access: AccessRights): string {
  const values = Object.values(access)
  return `${values.filter(Boolean).length} из ${values.length}`
}

function RolesTab() {
  const navigate = useNavigate()
  const roles = useStore((s) => s.roles)
  return (
    <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 18px',
          borderBottom: '1px solid var(--border-1)',
        }}
      >
        <div className="card-kicker">Должности</div>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/settings/roles/new')}>
          <ShieldPlus />
          Добавить
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 180 }}>Должность</th>
              <th style={{ width: 90 }}>Людей</th>
              <th style={{ width: 100 }}>Прав</th>
              {PERMISSION_SECTIONS.map((section) => (
                <th key={section} style={{ width: 110 }}>
                  {section}
                </th>
              ))}
              <th style={{ width: 88 }} />
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr
                key={r.name}
                className="row-click"
                onClick={() => navigate(`/settings/roles/${encodeURIComponent(r.name)}`)}
              >
                <td>
                  <div style={{ fontWeight: 600 }}>{r.name}</div>
                </td>
                <td>{r.people}</td>
                <td style={{ fontWeight: 700 }}>
                  {r.permissions.length} из {ALL_PERMISSION_IDS.length}
                </td>
                {PERMISSION_SECTIONS.map((section) => {
                  const ids = permissionsOfSection(section).map((p) => p.id)
                  const on = ids.filter((id) => r.permissions.includes(id)).length
                  return (
                    <td key={section} className={on === 0 ? 'muted' : ''}>
                      {on} из {ids.length}
                    </td>
                  )
                })}
                <td>
                  <div className="cell-actions">
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/settings/roles/${encodeURIComponent(r.name)}`)
                      }}
                    >
                      Изменить
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ListFoot note="Права применяются при следующем входе пользователя">
        <button className="btn btn-ghost btn-sm" type="button">
          <ShieldCheck />
          Журнал изменений прав
        </button>
      </ListFoot>
    </div>
  )
}

function RequisitesTab() {
  const stored = useStore((s) => s.requisites)
  const [draft, setDraft] = useState<Requisites>(stored)
  const patch = (p: Partial<Requisites>) => setDraft((d) => ({ ...d, ...p }))

  return (
    <div className="surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: 22,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ padding: 20, gap: 14 }}>
          <div className="card-kicker">Организация</div>
          <TextField label="Наименование" value={draft.name} onChange={(v) => patch({ name: v })} />
          <div className="form-grid">
            <TextField label="ИНН" value={draft.inn} onChange={(v) => patch({ inn: v })} />
            <TextField label="КПП" value={draft.kpp} onChange={(v) => patch({ kpp: v })} />
          </div>
          <div className="form-grid">
            <TextField label="ОГРН" value={draft.ogrn} onChange={(v) => patch({ ogrn: v })} />
            <TextField
              label="Система налогообложения"
              value={draft.taxation}
              onChange={(v) => patch({ taxation: v })}
            />
          </div>
          <TextField
            label="Юридический адрес"
            value={draft.legalAddress}
            onChange={(v) => patch({ legalAddress: v })}
          />
          <TextField
            label="Фактический адрес"
            value={draft.actualAddress}
            onChange={(v) => patch({ actualAddress: v })}
          />
        </div>

        <div className="card" style={{ padding: 20, gap: 14 }}>
          <div className="card-kicker">Контакты для клиентов</div>
          <div className="form-grid">
            <PhoneField label="Телефон" value={draft.phone} onChange={(v) => patch({ phone: v })} />
            <TextField label="Почта" value={draft.email} onChange={(v) => patch({ email: v })} />
          </div>
          <TextField label="Сайт" value={draft.site} onChange={(v) => patch({ site: v })} />
          <TextField
            label="Режим работы центра"
            value={draft.schedule}
            onChange={(v) => patch({ schedule: v })}
          />
        </div>
      </div>

      <ListFoot note="Изменения попадают в чеки и договоры сразу после сохранения">
        <button className="btn btn-secondary btn-sm" type="button" onClick={() => setDraft(stored)}>
          Отменить
        </button>
        <button className="btn btn-primary btn-sm" type="button" onClick={() => actions.saveRequisites(draft)}>
          Сохранить
        </button>
      </ListFoot>
    </div>
  )
}

/** The reference lists that feed the cash windows — the string[] fields only. */
type ListKey = {
  [K in keyof PaymentSettings]: PaymentSettings[K] extends string[] ? K : never
}[keyof PaymentSettings]

function PaymentsTab() {
  const stored = useStore((s) => s.paymentSettings)
  const [draft, setDraft] = useState<PaymentSettings>(stored)

  const toggle = (id: string) =>
    setDraft((d) => ({
      ...d,
      methods: d.methods.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
    }))

  const addTo = (key: ListKey, label: string) => {
    const value = window.prompt(label)
    if (!value) return
    setDraft((d) => ({ ...d, [key]: [...d[key], value] }))
  }

  const lists: { key: ListKey; title: string; add: string }[] = [
    { key: 'collectionGrounds', title: 'Основания для инкассации', add: 'Добавить основание' },
    { key: 'depositGrounds', title: 'Основания для внесения', add: 'Добавить основание' },
    { key: 'discrepancyReasons', title: 'Причины расхождения', add: 'Добавить причину' },
    { key: 'refundReasons', title: 'Причины возврата', add: 'Добавить причину' },
  ]

  return (
    <div className="surface" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          minHeight: 0,
          padding: 22,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 22,
          alignItems: 'start',
        }}
      >
        <div className="card" style={{ padding: 20, gap: 12 }}>
          <div className="card-kicker">Способы оплаты</div>
          {draft.methods.map((m) => (
            <Checkbox key={m.id} checked={m.enabled} onChange={() => toggle(m.id)}>
              {m.label}
            </Checkbox>
          ))}
        </div>

        <DataModeCard />

        {lists.map((list) => (
          <div key={list.key} className="card" style={{ padding: 20, gap: 10 }}>
            <div className="card-kicker">{list.title}</div>
            {draft[list.key].map((value, i) => (
              <div className="ref-row" key={`${list.key}-${i}`}>
                <span>{value}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  type="button"
                  onClick={() => {
                    const next = window.prompt('Изменить', value)
                    if (!next) return
                    setDraft((d) => ({
                      ...d,
                      [list.key]: d[list.key].map((v, j) => (j === i ? next : v)),
                    }))
                  }}
                >
                  Изменить
                </button>
              </div>
            ))}
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => addTo(list.key, list.add)}
            >
              <Plus />
              {list.add}
            </button>
          </div>
        ))}

        <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
          <button className="btn btn-primary" type="button" onClick={() => actions.savePaymentSettings(draft)}>
            Сохранить
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => setDraft(stored)}>
            Отменить
          </button>
        </div>
      </div>

      <ListFoot note="Списки оснований и причин подставляются в окна инкассации, внесения, закрытия смены и возврата" />
    </div>
  )
}

/** Switches the whole dataset. Useful while the product is being checked by
 *  hand: walk a shift through on an empty till, then put the demo back. */
function DataModeCard() {
  const mayReset = useCan('settings.reset')
  const mode = useStore((s) => s.mode)
  const orders = useStore((s) => s.orders.length)
  const ops = useStore((s) => cashJournal(s).length)

  const switchTo = (next: DataMode) => {
    const ok = window.confirm(
      next === 'clean'
        ? 'Удалить все заказы и операции кассы и начать с пустой смены? Клиенты, справочники и сотрудники останутся.'
        : 'Вернуть демо-смену из макета? Всё, что вы ввели, будет удалено.',
    )
    if (ok) actions.resetTo(next)
  }

  return (
    <div className="card" style={{ padding: 20, gap: 12 }}>
      <div className="card-kicker">Данные для проверки</div>
      <div className="card-row">
        <span>Сейчас</span>
        <span>{mode === 'clean' ? 'Пустая смена' : 'Демо-смена из макета'}</span>
      </div>
      <div className="card-row">
        <span>Заказов · операций кассы</span>
        <span>
          {orders} · {ops}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`btn ${mode === 'clean' ? 'btn-secondary' : 'btn-primary'}`}
          type="button"
          disabled={!mayReset}
          title={mayReset ? '' : 'Нет права «Обнуление кассы и заказов»'}
          onClick={() => switchTo('clean')}
        >
          Обнулить кассу и заказы
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={!mayReset}
          title={mayReset ? '' : 'Нет права «Обнуление кассы и заказов»'}
          onClick={() => switchTo('demo')}
        >
          Вернуть демо-смену
        </button>
      </div>
      <div className="card-note">
        Пустая смена: заказов и операций нет, касса на нуле, у клиентов нулевой баланс.
        Справочники, сотрудники и список клиентов сохраняются — иначе заказ не собрать.
      </div>
    </div>
  )
}

function NotificationsTab() {
  const notifications = useStore((s) => s.notifications)
  return (
    <>
      <div
        className="surface"
        data-compact=""
        style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 20 }}
      >
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 300 }}>Сценарий</th>
                <th style={{ width: 160 }}>Получатель</th>
                <th style={{ width: 150 }}>Канал</th>
                <th style={{ width: 200 }}>Когда</th>
                <th style={{ width: 130 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr
                  key={n.id}
                  className="row-click"
                  onClick={() => actions.toggleNotification(n.id)}
                  title="Нажмите, чтобы включить или выключить сценарий"
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>{n.scenario}</div>
                  </td>
                  <td>{n.recipient}</td>
                  <td>{n.channel}</td>
                  <td>{n.when}</td>
                  <td>
                    {n.enabled ? <Pill tone="success">Включено</Pill> : <Pill tone="neutral">Выключено</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="button">
          Сохранить
        </button>
        <button className="btn btn-secondary" type="button">
          Отменить
        </button>
      </div>
    </>
  )
}
