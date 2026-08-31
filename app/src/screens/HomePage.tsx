import { Page } from '../components/AppShell'
import { Stat } from '../components/ui'
import { clock, counted, dayAndMonth, money, plural, weekday } from '../lib/format'
import { cashSummary, openOrders, useCan, useStore } from '../state/store'

/** Screen 03 — «Главная»: state of the shift and the day's figures. */
export function HomePage() {
  const shift = useStore((s) => s.shift)
  const summary = useStore(cashSummary)
  const mayRevenue = useCan('home.revenue')

  // «Детей в зале» — дети, отмеченные в заказах, чей визит ещё не закончился.
  const inHall = useStore((s) =>
    openOrders(s)
      .filter((o) => o.endedAt === undefined)
      .reduce((sum, o) => sum + o.childIds.length, 0),
  )
  const capacity = 45

  return (
    <Page>
      <div style={{ marginBottom: 20 }}>
        <div className="h1" style={{ fontSize: 28 }}>
          Смена {dayAndMonth(shift.date)}
        </div>
        <p className="subtitle" style={{ margin: 0 }}>
          {weekday(shift.date)} · открыта в {clock(shift.openedAt)} · администратор {shift.admin},
          кассир {shift.cashier}
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mayRevenue ? 'repeat(2, 1fr)' : '1fr',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {mayRevenue && (
          <Stat
            label="Выручка за смену"
            value={money(summary.revenue)}
            note={counted(summary.payments, 'оплата', 'оплаты', 'оплат')}
          />
        )}
        <Stat
          label="Детей в зале"
          value={`${inHall} из ${capacity}`}
          note={`свободно ${capacity - inHall} ${plural(capacity - inHall, 'место', 'места', 'мест')}`}
        />
      </div>
    </Page>
  )
}
