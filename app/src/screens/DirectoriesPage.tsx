import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Download, Plus } from 'lucide-react'
import { Page } from '../components/AppShell'
import { ListFoot, PageHead, Pill, SearchBar, SortableTh, SubTabs } from '../components/ui'
import { DASH, durationWords, money, plural } from '../lib/format'
import { useStore } from '../state/store'
import type { CatalogCategory, CatalogItem } from '../domain/types'

type TabId = 'tariffs' | 'services' | 'goods' | 'discounts'

const TAB_CATEGORY: Record<TabId, CatalogCategory> = {
  tariffs: 'Тариф',
  services: 'Услуга',
  goods: 'Товар',
  discounts: 'Скидка',
}

const ADD_LABEL: Record<TabId, string> = {
  tariffs: 'Добавить тариф',
  services: 'Добавить услугу',
  goods: 'Добавить товар',
  discounts: 'Добавить скидку',
}

/** Screens 19–22 — «Справочники», «Услуги», «Товары», «Скидки».
 *  One page; the tab decides which columns are worth showing. */
export function DirectoriesPage() {
  const { tab: routeTab } = useParams()
  const navigate = useNavigate()
  const known: TabId[] = ['tariffs', 'services', 'goods', 'discounts']
  const tab: TabId = known.includes(routeTab as TabId) ? (routeTab as TabId) : 'tariffs'
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(12)

  const catalog = useStore((s) => s.catalog)
  const grounds = useStore((s) => s.discountGrounds)

  const counts = {
    tariffs: catalog.filter((c) => c.category === 'Тариф').length,
    services: catalog.filter((c) => c.category === 'Услуга').length,
    goods: catalog.filter((c) => c.category === 'Товар').length,
    discounts: grounds.length,
  }

  const items = catalog
    .filter((c) => c.category === TAB_CATEGORY[tab])
    .filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()))

  const lastChanged = catalog
    .map((c) => c.changedAt ?? '')
    .filter(Boolean)
    .sort((a, b) => toDate(b) - toDate(a))[0]

  const subtitle =
    tab === 'services'
      ? `Услуги · ${counts.services} ${plural(counts.services, 'позиция', 'позиции', 'позиций')}`
      : tab === 'goods'
        ? `Товары · ${counts.goods} ${plural(counts.goods, 'позиция', 'позиции', 'позиций')}`
        : tab === 'discounts'
          ? `Скидки · ${counts.discounts} ${plural(counts.discounts, 'основание', 'основания', 'оснований')}`
          : `Тарифы · ${counts.tariffs} ${plural(counts.tariffs, 'позиция', 'позиции', 'позиций')} · последнее изменение ${lastChanged}`

  const shown = items.slice(0, limit)

  return (
    <Page>
      <PageHead title="Справочники" subtitle={subtitle} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={tab === 'discounts' ? 'Поиск по основанию' : 'Поиск по наименованию'}
        />
        <button
          className="btn btn-primary"
          type="button"
          onClick={() => navigate(`/directories/${tab}/new/${TAB_CATEGORY[tab]}`)}
        >
          <Plus />
          {ADD_LABEL[tab]}
        </button>
      </div>

      <SubTabs
        active={tab}
        onChange={(id) => {
          navigate(id === 'tariffs' ? '/directories' : `/directories/${id}`)
          setLimit(12)
        }}
        style={{ marginBottom: 20 }}
        tabs={[
          { id: 'tariffs', label: 'Тарифы', badge: counts.tariffs },
          { id: 'services', label: 'Услуги', badge: counts.services },
          { id: 'goods', label: 'Товары', badge: counts.goods },
          { id: 'discounts', label: 'Скидки', badge: counts.discounts },
        ]}
      />

      <div className="surface" data-compact="" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {tab === 'discounts' ? <DiscountsTable /> : <CatalogTable items={shown} tab={tab} />}
        </div>
        <ListFoot
          note={
            tab === 'discounts'
              ? 'Скидки не суммируются — применяется наибольшая'
              : limit >= items.length
                ? `Показаны все ${items.length} ${plural(items.length, 'позиция', 'позиции', 'позиций')}`
                : `Показаны ${Math.min(limit, items.length)} из ${items.length} · остальные подгружаются при прокрутке`
          }
          onMore={tab !== 'discounts' && limit < items.length ? () => setLimit(limit + 12) : undefined}
        >
          {(tab === 'services' || tab === 'goods' || tab === 'discounts') && (
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => exportCsv(items)}>
              <Download />
              Выгрузить
            </button>
          )}
        </ListFoot>
      </div>
    </Page>
  )
}

function CatalogTable({ items, tab }: { items: CatalogItem[]; tab: TabId }) {
  const navigate = useNavigate()
  const showDuration = tab === 'tariffs'
  const showPerformer = tab === 'services'

  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: showPerformer ? 360 : 330 }}>
            <SortableTh>Наименование</SortableTh>
          </th>
          <th style={{ width: 150 }}>Категория</th>
          <th style={{ width: 90 }}>Ед.</th>
          <th style={{ width: 120 }}>Цена</th>
          {showDuration && <th style={{ width: 140 }}>Длительность</th>}
          {showPerformer && <th style={{ width: 150 }}>Исполнитель</th>}
          <th style={{ width: 120 }}>Статус</th>
          <th style={{ width: 88 }} />
        </tr>
      </thead>
      <tbody>
        {items.map((c) => (
          <tr key={c.id} className="row-click" onClick={() => navigate(`/directories/item/${c.id}`)}>
            <td>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
            </td>
            <td>{showPerformer ? (c.group ?? c.category) : c.category}</td>
            <td>{c.unit}</td>
            <td style={{ fontWeight: 700 }}>{c.category === 'Скидка' ? `${c.price} %` : money(c.price)}</td>
            {showDuration && <td>{durationWords(c.durationMin)}</td>}
            {showPerformer && <td>{c.performer ?? DASH}</td>}
            <td>
              {c.status === 'active' ? (
                <Pill tone="success">Активен</Pill>
              ) : c.status === 'pending' ? (
                <Pill tone="warn">На согласовании</Pill>
              ) : (
                <Pill tone="neutral">Скрыт</Pill>
              )}
            </td>
            <td>
              <div className="cell-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/directories/item/${c.id}`)
                  }}
                >
                  Изменить
                </button>
              </div>
            </td>
          </tr>
        ))}
        {items.length === 0 && (
          <tr>
            <td colSpan={8} className="empty">
              Ничего не найдено
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}

function DiscountsTable() {
  const grounds = useStore((s) => s.discountGrounds)
  return (
    <table className="tbl">
      <thead>
        <tr>
          <th style={{ width: 250 }}>Основание</th>
          <th style={{ width: 100 }}>Процент</th>
          <th style={{ width: 160 }}>Применяется к</th>
          <th style={{ width: 150 }}>Срок</th>
          <th style={{ width: 190 }}>Подтверждение</th>
          <th style={{ width: 120 }}>Статус</th>
          <th style={{ width: 88 }} />
        </tr>
      </thead>
      <tbody>
        {grounds.map((g) => (
          <tr key={g.id}>
            <td>
              <div style={{ fontWeight: 600 }}>{g.name}</div>
            </td>
            <td style={{ fontWeight: 700 }}>{g.percent === null ? DASH : `${g.percent} %`}</td>
            <td>{g.appliesTo}</td>
            <td>{g.term}</td>
            <td>{g.proof}</td>
            <td>{g.active ? <Pill tone="success">Активна</Pill> : <Pill tone="neutral">Скрыта</Pill>}</td>
            <td>
              <div className="cell-actions">
                <button className="btn btn-secondary btn-sm" type="button">
                  Изменить
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function toDate(ru: string): number {
  const [d, m, y] = ru.split('.').map(Number)
  return new Date(y ?? 0, (m ?? 1) - 1, d ?? 1).getTime()
}

/** «Выгрузить» — a real CSV of what is on screen. */
function exportCsv(items: CatalogItem[]): void {
  const head = ['Наименование', 'Категория', 'Ед.', 'Цена', 'Статус']
  const rows = items.map((c) => [c.name, c.category, c.unit, String(c.price), c.status])
  const csv = [head, ...rows].map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n')
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'справочник.csv'
  a.click()
  URL.revokeObjectURL(url)
}
