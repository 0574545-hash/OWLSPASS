import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FileText, Printer } from 'lucide-react'
import { Modal } from '../components/Modal'
import { toast } from '../lib/toast'
import {
  Card,
  CardKicker,
  CardRow,
  CardTotal,
  MoneyField,
  SelectField,
  TextArea,
  TextField,
} from '../components/ui'
import { clock, money } from '../lib/format'
import { actions, cashSummary, openOrders, shiftClosed, unpaidOrders, useStore } from '../state/store'

/** Screen 16 — «Закрытие смены»: the counted cash in one line, the
 *  discrepancy worked out from it. */
export function ShiftCloseModal() {
  const navigate = useNavigate()
  const close = () => navigate('/cash')

  const summary = useStore(cashSummary)
  const reasons = useStore((s) => s.paymentSettings.discrepancyReasons)
  const unpaid = useStore((s) => unpaidOrders(s).length)
  const inHall = useStore((s) => openOrders(s).filter((o) => o.endedAt === undefined).length)
  const closed = useStore(shiftClosed)

  const [counted, setCounted] = useState(summary.cashOnHand)
  const [reason, setReason] = useState(reasons[0] ?? '')
  const [comment, setComment] = useState('')

  const discrepancy = counted - summary.cashOnHand

  return (
    <Modal
      title="Закрыть смену"
      onClose={close}
      hint="После закрытия операции смены нельзя изменить"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={close}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            type="button"
            disabled={closed}
            title={closed ? 'Смена уже закрыта — откройте новую' : 'Закрыть смену'}
            onClick={() => {
              if (actions.closeShift({ counted, reason, comment })) {
                toast('Смена закрыта — отчёт готов')
                navigate('/cash/report')
              }
            }}
          >
            Закрыть смену
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Операций" value={summary.ops} />
            <CardRow label="Наличные" value={money(summary.cashOnHand)} />
            <CardRow label="Безнал" value={money(summary.cashless)} />
            <CardRow label="Возвраты" value={money(-summary.refunds)} tone="neg" />
            <CardRow
              label="Расхождение"
              value={discrepancy === 0 ? '0' : money(discrepancy)}
              tone={discrepancy < 0 ? 'neg' : undefined}
            />
            <CardTotal label="Выручка" value={money(summary.revenue)} />
          </Card>

          <Card>
            <CardKicker>Незакрытые дела</CardKicker>
            <CardRow label="Неоплаченные заказы" value={<b className="neg">{unpaid}</b>} />
            <CardRow label="Дети в зале" value={<b>{inHall}</b>} />
          </Card>

          <div className="card-note">
            {discrepancy === 0
              ? 'Расхождений нет. Смену можно закрыть с долгами — они перейдут на клиентов.'
              : `${discrepancy < 0 ? 'Недостача' : 'Излишек'} ${money(Math.abs(discrepancy))} попадёт в историю смен. Смену можно закрыть с долгами — они перейдут на клиентов.`}
          </div>
        </>
      }
    >
      <div className="form-grid">
        <MoneyField label="По системе" value={summary.cashOnHand} />
        <MoneyField label="Фактически в кассе" value={counted} onChange={setCounted} />
      </div>
      {discrepancy !== 0 && (
        <SelectField label="Причина расхождения" value={reason} options={reasons} onChange={setReason} />
      )}
      <TextArea label="Комментарий" value={comment} onChange={setComment} />
    </Modal>
  )
}

/** Screen 17 — «Отчёт по смене»: opens right after the shift closes. */
export function ShiftReportModal() {
  const navigate = useNavigate()
  const report = useStore((s) => s.lastReport)
  const [comment, setComment] = useState(report?.comment ?? '')

  if (!report) {
    return (
      <Modal title="Отчёт недоступен" onClose={() => navigate('/cash')} aside={null}>
        <div className="empty">Смена ещё не закрыта — отчёт появится после пересчёта кассы.</div>
      </Modal>
    )
  }

  const fileName = `Отчёт_смена_${report.no}_${report.date}.pdf`

  const done = () => {
    actions.finishShiftReport()
    // Смена закрыта, но работа не окончена: показываем историю смен.
    navigate('/cash/shifts')
  }

  return (
    <Modal
      title={`Смена № ${report.no} закрыта`}
      onClose={done}
      hint="Отчёт сохранён в истории смен — выйти из системы можно в шапке"
      actions={
        <>
          <button className="btn btn-secondary" type="button" onClick={done}>
            Готово
          </button>
          <button className="btn btn-primary" type="button" onClick={() => window.print()}>
            <Printer />
            Печать
          </button>
        </>
      }
      aside={
        <>
          <Card>
            <CardRow label="Операций" value={report.ops} />
            <CardRow label="Наличные по расчёту" value={money(report.cash)} />
            <CardRow label="Фактически в кассе" value={money(report.counted)} />
            <CardRow label="Безнал" value={money(report.cashless)} />
            <CardRow label="Возвраты" value={money(-report.refunds)} tone="neg" />
            <CardRow label="Инкассировано" value={money(report.collected)} />
            <CardRow
              label="Расхождение"
              value={report.discrepancy === 0 ? '0' : money(report.discrepancy)}
              tone={report.discrepancy < 0 ? 'neg' : undefined}
            />
            <CardTotal label="Выручка за смену" value={money(report.revenue)} />
          </Card>
          <div className="card-note">
            Отчёт содержит операции смены, расхождение и подпись кассира. Он останется доступен в
            истории смен.
          </div>
        </>
      }
    >
      <div className="form-grid">
        <TextField label="Открыта" value={`${report.date}, ${clock(report.openedAt)}`} />
        <TextField label="Закрыта" value={`${report.date}, ${clock(report.closedAt)}`} />
      </div>
      <div className="form-grid">
        <TextField label="Администратор" value={report.admin} />
        <TextField label="Кассир" value={report.cashier} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>Файл отчёта</span>
        <div className="file-row">
          <FileText style={{ width: 16, height: 16, color: 'var(--owls-orange)' }} />
          <span className="file-name" style={{ flex: 1 }}>
            {fileName}
          </span>
          <span style={{ fontSize: 11, color: 'var(--fg-3)' }}>1 стр.</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={() => window.print()}>
            <Download />
            Скачать
          </button>
        </div>
      </div>

      <TextArea label="Комментарий к смене" value={comment} onChange={setComment} />
    </Modal>
  )
}
