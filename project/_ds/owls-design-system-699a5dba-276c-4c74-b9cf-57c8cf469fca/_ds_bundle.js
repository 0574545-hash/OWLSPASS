/* @ds-bundle: {"format":4,"namespace":"OWLSDesignSystem_699a5d","components":[],"sourceHashes":{"ui_kits/dashboard/Atoms.jsx":"db5d11cb9149","ui_kits/dashboard/DataTable.jsx":"98a621d54eb7","ui_kits/dashboard/FinanceScreen.jsx":"673b750d57e8","ui_kits/dashboard/Icon.jsx":"75b7540dc026","ui_kits/dashboard/InfoScreen.jsx":"179a20575813","ui_kits/dashboard/MarketplaceScreen.jsx":"9c0cef899f49","ui_kits/dashboard/PageHeader.jsx":"d702c33aae2f","ui_kits/dashboard/Placeholders.jsx":"a8118e5d21cb","ui_kits/dashboard/SettingsScreen.jsx":"7d4069cc567f","ui_kits/dashboard/Shell.jsx":"78359f23ac62","ui_kits/dashboard/Sidebar.jsx":"daf563ea4a8c","ui_kits/dashboard/TasksScreen.jsx":"ef9b4eb3e09c","ui_kits/dashboard/TopBar.jsx":"e3b4b5f35b42"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.OWLSDesignSystem_699a5d = window.OWLSDesignSystem_699a5d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// ui_kits/dashboard/Atoms.jsx
try { (() => {
/* Atoms — small primitives used throughout the kit.
   Button, IconButton, StatusPill, Field. */

function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  onClick,
  type = 'button'
}) {
  const cls = `btn btn-${variant}` + (size === 'sm' ? ' btn-sm' : '');
  return /*#__PURE__*/React.createElement("button", {
    type: type,
    className: cls,
    onClick: onClick
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === 'sm' ? 13 : 14
  }), children);
}
function IconButton({
  icon,
  bubble,
  onClick,
  title
}) {
  return /*#__PURE__*/React.createElement("button", {
    className: "icon-btn",
    onClick: onClick,
    title: title
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 17
  }), bubble != null && /*#__PURE__*/React.createElement("span", {
    className: "bubble"
  }, bubble));
}
const PILL_VARIANTS = {
  'Завершена': 'success',
  'В работе': 'progress',
  'На проверке': 'warn',
  'Обычный': 'info',
  'Высокий': 'danger'
};
function StatusPill({
  children,
  variant
}) {
  const v = variant || PILL_VARIANTS[children] || 'info';
  return /*#__PURE__*/React.createElement("span", {
    className: `pill pill-${v}`
  }, children);
}
function Field({
  label,
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "field",
    style: style
  }, /*#__PURE__*/React.createElement("span", {
    className: "field-label"
  }, label), children);
}
function Check({
  on,
  children,
  onChange
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: 'check' + (on ? ' on' : ''),
    onClick: () => onChange && onChange(!on)
  }, /*#__PURE__*/React.createElement("span", {
    className: "box"
  }, on ? '✓' : ''), children);
}
function Surface({
  children,
  style
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "surface",
    style: style
  }, children);
}
Object.assign(window, {
  Button,
  IconButton,
  StatusPill,
  Field,
  Check,
  Surface
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Atoms.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/DataTable.jsx
try { (() => {
/* Generic data table. Each column = { key, label, width?, filter?, render? }
   Rows = array of objects. Actions column rendered separately via rowActions. */

function DataTable({
  columns,
  rows,
  rowActions
}) {
  return /*#__PURE__*/React.createElement(Surface, null, /*#__PURE__*/React.createElement("table", {
    className: "tbl"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map(c => /*#__PURE__*/React.createElement("th", {
    key: c.key,
    style: c.width ? {
      width: c.width
    } : {}
  }, /*#__PURE__*/React.createElement("span", {
    className: "col-h"
  }, c.filter && /*#__PURE__*/React.createElement(Icon, {
    name: "filter",
    size: 12
  }), c.label))), rowActions && /*#__PURE__*/React.createElement("th", {
    style: {
      width: 80,
      textAlign: 'right'
    }
  }, "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F"))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, i) => /*#__PURE__*/React.createElement("tr", {
    key: r.id || i
  }, columns.map(c => /*#__PURE__*/React.createElement("td", {
    key: c.key
  }, c.render ? c.render(r) : r[c.key])), rowActions && /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "cell-actions",
    style: {
      justifyContent: 'flex-end'
    }
  }, rowActions(r))))))));
}
window.DataTable = DataTable;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/DataTable.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/FinanceScreen.jsx
try { (() => {
/* Finance screen — Касса tab with three Расход rows from the screenshot.
   The Бухгалтерия tab is shown but disabled-style. */

const FIN_TABS = [{
  id: 'cash',
  label: 'Касса',
  icon: 'russian-ruble'
}, {
  id: 'book',
  label: 'Бухгалтерия',
  icon: 'book-open'
}];
const TX = [{
  id: 1,
  type: 'out',
  amount: '7 931,47 ₽',
  date: '10.05.2026',
  counter: '',
  category: 'Списание',
  note: 'Списание #3'
}, {
  id: 2,
  type: 'out',
  amount: '142 607,30 ₽',
  date: '09.05.2026',
  counter: '',
  category: 'Списание',
  note: 'Списание #2'
}, {
  id: 3,
  type: 'out',
  amount: '12 964,30 ₽',
  date: '09.05.2026',
  counter: '',
  category: 'Списание',
  note: 'Списание #1'
}];
function FinanceScreen() {
  const [tab, setTab] = React.useState('cash');
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: FIN_TABS,
    active: tab,
    onSelect: setTab
  }), /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "minus-circle"
  }, "\u0420\u0430\u0441\u0445\u043E\u0434"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "plus-circle"
  }, "\u041F\u0440\u0438\u0445\u043E\u0434"), /*#__PURE__*/React.createElement(Field, {
    label: "\u041F\u043E\u0438\u0441\u043A",
    style: {
      flex: 1,
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u2026"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u041F\u0435\u0440\u0438\u043E\u0434",
    style: {
      maxWidth: 240
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "13.04.2026 \u2014 13.05.2026"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "calendar"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "plus"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm",
    icon: "eye"
  })), /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'type',
      label: 'Тип платежа',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
        className: 'dot ' + (r.type === 'out' ? 'dot-out' : 'dot-in')
      }), "\u0420\u0430\u0441\u0445\u043E\u0434")
    }, {
      key: 'amount',
      label: 'Сумма',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 600
        }
      }, r.amount)
    }, {
      key: 'date',
      label: 'Дата',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, r.date)
    }, {
      key: 'counter',
      label: 'Контрагент',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "muted"
      }, r.counter || '—')
    }, {
      key: 'category',
      label: 'Статья расходов',
      filter: true
    }, {
      key: 'note',
      label: 'Комментарий',
      filter: true
    }],
    rows: TX,
    rowActions: r => [/*#__PURE__*/React.createElement(IconButton, {
      key: "e",
      icon: "pencil",
      title: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C"
    }), /*#__PURE__*/React.createElement(IconButton, {
      key: "d",
      icon: "trash-2",
      title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"
    })]
  }), /*#__PURE__*/React.createElement("div", {
    className: "summary"
  }, /*#__PURE__*/React.createElement("div", {
    className: "item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\u0418\u0442\u043E\u0433\u043E \u043F\u0440\u0438\u0445\u043E\u0434"), " ", /*#__PURE__*/React.createElement("span", {
    className: "value"
  }, "0,00 \u20BD")), /*#__PURE__*/React.createElement("div", {
    className: "divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\u0418\u0442\u043E\u0433\u043E \u0440\u0430\u0441\u0445\u043E\u0434"), " ", /*#__PURE__*/React.createElement("span", {
    className: "value"
  }, "163 503,07 \u20BD")), /*#__PURE__*/React.createElement("div", {
    className: "divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, "\u0418\u0442\u043E\u0433\u043E \u0441\u0430\u043B\u044C\u0434\u043E"), " ", /*#__PURE__*/React.createElement("span", {
    className: "value neg"
  }, "\u2212163 503,07 \u20BD"))));
}
window.FinanceScreen = FinanceScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/FinanceScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Icon.jsx
try { (() => {
/* Icon helper — thin wrapper over lucide that ensures consistent stroke + size.
   Lucide is loaded globally from CDN in index.html. */

function Icon({
  name,
  size = 16,
  className = '',
  style = {}
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (window.lucide && ref.current) {
      ref.current.setAttribute('data-lucide', name);
      window.lucide.createIcons({
        icons: window.lucide.icons,
        nameAttr: 'data-lucide'
      });
    }
  }, [name]);
  return /*#__PURE__*/React.createElement("i", {
    ref: ref,
    "data-lucide": name,
    className: 'lucide ' + className,
    style: {
      width: size,
      height: size,
      display: 'inline-block',
      flexShrink: 0,
      ...style
    }
  });
}
window.Icon = Icon;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Icon.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/InfoScreen.jsx
try { (() => {
/* Information / dashboard screen. The real product's KPI layout is unknown;
   this is a brand-consistent stand-in built from the visual foundations. */

const KPIS = [{
  label: 'Выручка за месяц',
  value: '2 480 110 ₽',
  trend: '+12%',
  pos: true
}, {
  label: 'Заказов',
  value: '1 247',
  trend: '+8%',
  pos: true
}, {
  label: 'Возвраты',
  value: '63',
  trend: '−4%',
  pos: true
}, {
  label: 'Средний чек',
  value: '1 989 ₽',
  trend: '+3%',
  pos: true
}];
const SERIES = [{
  d: 'Пн',
  v: 280
}, {
  d: 'Вт',
  v: 340
}, {
  d: 'Ср',
  v: 410
}, {
  d: 'Чт',
  v: 380
}, {
  d: 'Пт',
  v: 520,
  accent: true
}, {
  d: 'Сб',
  v: 470
}, {
  d: 'Вс',
  v: 360
}];
function InfoScreen() {
  const max = Math.max(...SERIES.map(s => s.v));
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "h1"
  }, "\u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F"), /*#__PURE__*/React.createElement("p", {
    className: "subtitle"
  }, "\u0421\u0432\u043E\u0434\u043A\u0430 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 07.05.2026 \u2014 13.05.2026 \xB7 \u0418\u041F \u0421\u0415\u041C\u0415\u041D\u0415\u041D\u041A\u041E")), /*#__PURE__*/React.createElement("div", {
    className: "kpis"
  }, KPIS.map(k => /*#__PURE__*/React.createElement("div", {
    key: k.label,
    className: "kpi"
  }, /*#__PURE__*/React.createElement("span", {
    className: "label"
  }, k.label), /*#__PURE__*/React.createElement("span", {
    className: "value"
  }, k.value), /*#__PURE__*/React.createElement("span", {
    className: 'trend' + (k.pos ? '' : ' neg')
  }, /*#__PURE__*/React.createElement(Icon, {
    name: k.trend.startsWith('−') ? 'trending-down' : 'trending-up',
    size: 12
  }), k.trend, /*#__PURE__*/React.createElement("span", {
    className: "tail"
  }, "\u043A \u043F\u0440\u043E\u0448\u043B\u043E\u0439 \u043D\u0435\u0434\u0435\u043B\u0435"))))), /*#__PURE__*/React.createElement("div", {
    className: "chart-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "chart-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "chart-title"
  }, "\u0412\u044B\u0440\u0443\u0447\u043A\u0430 \u043F\u043E \u0434\u043D\u044F\u043C"), /*#__PURE__*/React.createElement("div", {
    className: "chart-sub"
  }, "\u0442\u044B\u0441. \u20BD \xB7 \u0432\u0441\u0435 \u043C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441\u044B")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "\u041D\u0435\u0434\u0435\u043B\u044F"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "\u041C\u0435\u0441\u044F\u0446"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm"
  }, "\u041A\u0432\u0430\u0440\u0442\u0430\u043B"))), /*#__PURE__*/React.createElement("div", {
    className: "bars"
  }, SERIES.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.d,
    className: 'bar' + (s.accent ? ' accent' : ''),
    style: {
      height: s.v / max * 160 + 'px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, s.v)))), /*#__PURE__*/React.createElement("div", {
    className: "bar-axis"
  }, SERIES.map(s => /*#__PURE__*/React.createElement("span", {
    key: s.d
  }, s.d)))));
}
window.InfoScreen = InfoScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/InfoScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/MarketplaceScreen.jsx
try { (() => {
/* Marketplace screen — the chat list page from the screenshot.
   Top-level tabs = marketplace integrations; sub-tabs = chat sub-sections. */

const MP_TABS = [{
  id: 'ozon',
  label: 'Озон',
  badge: 1
}, {
  id: 'wb',
  label: 'Вайлдберриз'
}, {
  id: 'ym',
  label: 'Яндекс Маркет',
  badge: 2
}, {
  id: 'ali',
  label: 'Алиэкспресс (не настроен)',
  dim: true
}, {
  id: 'mm',
  label: 'Мегамаркет (не настроен)',
  dim: true
}];
const MP_SUBS = [{
  id: 'msg',
  label: 'Сообщения',
  icon: 'message-circle'
}, {
  id: 'rev',
  label: 'Отзывы',
  icon: 'star'
}, {
  id: 'ret',
  label: 'Возвраты',
  icon: 'rotate-ccw'
}, {
  id: 'pick',
  label: 'Сборочные задания',
  icon: 'package-2',
  badge: 1
}];
const CHATS = [{
  id: 'b32cfcfc-5cf9-4b91-8bd4-53ab786a4850',
  type: 'Покупатель — продавец',
  unread: 7,
  at: '2026-05-12T15:22:46.270185Z'
}, {
  id: '5944e46f-0dd4-4042-a07e-169d0bd4b107',
  type: 'Покупатель — продавец',
  unread: 5,
  at: '2026-05-08T05:59:34.996046Z'
}, {
  id: '1db3145e-4f3c-4dd5-9a88-bf3c5c7f6fb1',
  type: 'Покупатель — продавец',
  unread: 5,
  at: '2026-05-07T17:12:20.283669Z'
}, {
  id: 'a8f7a511-8653-4a7f-8c42-23959bde40c8',
  type: 'Покупатель — продавец',
  unread: 1,
  at: '2026-05-07T10:31:40.002019Z'
}, {
  id: 'bbea4a75-b9ce-4396-98fa-486555301a3d',
  type: 'Покупатель — продавец',
  unread: 1,
  at: '2026-05-04T17:08:44.182140Z'
}, {
  id: 'cd5ae909-ff60-4da0-a098-75f259d70810',
  type: 'Поддержка Селлеров',
  unread: 0,
  at: '2026-05-02T10:06:10.771591Z'
}, {
  id: 'ebf8bb0f-a280-4ac7-92b5-1d94f3d180d7',
  type: 'Покупатель — продавец',
  unread: 0,
  at: '2026-05-02T08:38:03.148391Z'
}, {
  id: '47fdcd13-3a8b-4c33-ac55-648055b9f6f9',
  type: 'Покупатель — продавец',
  unread: 0,
  at: '2026-05-01T19:55:13.310362Z'
}, {
  id: 'c464272c-ee5f-41f9-a859-b622353dba50',
  type: 'Покупатель — продавец',
  unread: 0,
  at: '2026-04-30T13:38:21.973672Z'
}, {
  id: '0102f3e6-16d5-4c82-a531-a361579afbc7',
  type: 'Покупатель — продавец',
  unread: 1,
  at: '2026-04-30T08:29:07.278171Z'
}];
function MarketplaceScreen() {
  const [mp, setMp] = React.useState('ozon');
  const [sub, setSub] = React.useState('msg');
  const [onlyUnread, setOnlyUnread] = React.useState(false);
  const visible = onlyUnread ? CHATS.filter(c => c.unread > 0) : CHATS;
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: MP_TABS,
    active: mp,
    onSelect: setMp
  }), /*#__PURE__*/React.createElement(SubTabs, {
    items: MP_SUBS,
    active: sub,
    onSelect: setSub
  }), /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0447\u0430\u0442\u0430"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input has-caret",
    defaultValue: "\u0412\u0441\u0435"
  })), /*#__PURE__*/React.createElement(Check, {
    on: onlyUnread,
    onChange: setOnlyUnread
  }, "\u0422\u043E\u043B\u044C\u043A\u043E \u043D\u0435\u043F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043D\u044B\u0435"), /*#__PURE__*/React.createElement(Field, {
    label: "\u041B\u0438\u043C\u0438\u0442",
    style: {
      maxWidth: 110
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "30"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u0421\u043C\u0435\u0449\u0435\u043D\u0438\u0435",
    style: {
      maxWidth: 110
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "0"
  })), /*#__PURE__*/React.createElement("span", {
    className: "div"
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "refresh-cw"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0447\u0430\u0442\u044B")), /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'id',
      label: 'ID чата',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, r.id)
    }, {
      key: 'type',
      label: 'Тип'
    }, {
      key: 'unread',
      label: 'Непрочит.',
      render: r => /*#__PURE__*/React.createElement("span", {
        style: {
          fontWeight: 600
        }
      }, r.unread)
    }, {
      key: 'at',
      label: 'Создан',
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "mono muted"
      }, r.at)
    }],
    rows: visible,
    rowActions: r => [/*#__PURE__*/React.createElement(Button, {
      key: "o",
      variant: "secondary",
      size: "sm"
    }, "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0443"), /*#__PURE__*/React.createElement(Button, {
      key: "r",
      variant: "ghost",
      size: "sm"
    }, "\u041F\u0440\u043E\u0447\u0438\u0442\u0430\u043D\u043E")]
  }));
}
window.MarketplaceScreen = MarketplaceScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/MarketplaceScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/PageHeader.jsx
try { (() => {
/* Tab strips. <Tabs> = top tabs (marketplaces / settings tabs).
   <SubTabs> = the second-level tabs (Сообщения / Отзывы / …). */

function Tabs({
  items,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "tabs-row"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    className: 'tab' + (it.dim ? ' dim' : '') + (active === it.id ? ' active' : ''),
    onClick: () => !it.dim && onSelect && onSelect(it.id)
  }, it.icon && /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 16
  }), /*#__PURE__*/React.createElement("span", null, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
    className: "tab-badge"
  }, it.badge))));
}
function SubTabs({
  items,
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "subtabs"
  }, items.map(it => /*#__PURE__*/React.createElement("button", {
    key: it.id,
    className: 'subtab' + (active === it.id ? ' active' : ''),
    onClick: () => onSelect && onSelect(it.id)
  }, it.icon && /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 15
  }), /*#__PURE__*/React.createElement("span", null, it.label), it.badge != null && /*#__PURE__*/React.createElement("span", {
    className: "tab-badge"
  }, it.badge))));
}
Object.assign(window, {
  Tabs,
  SubTabs
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/PageHeader.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Placeholders.jsx
try { (() => {
/* Generic empty / placeholder screens for sections we don't have a screenshot for,
   plus the Website locked-state from the real screenshot. */

function LockedScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page",
    style: {
      display: 'flex',
      justifyContent: 'center',
      paddingTop: 80
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "lock"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 32
  }), /*#__PURE__*/React.createElement("div", {
    className: "msg"
  }, "\u0412\u0430\u0448 \u0442\u0430\u0440\u0438\u0444 \u043D\u0435 \u043F\u0440\u0435\u0434\u0443\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u044D\u0442\u043E\u043C\u0443 \u0444\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u0443.")));
}
function PlaceholderScreen({
  title,
  hint
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement("h1", {
    className: "h1"
  }, title), /*#__PURE__*/React.createElement("p", {
    className: "subtitle"
  }, hint || 'Раздел не представлен в этом UI kit — экран не был включён в исходные скриншоты.')), /*#__PURE__*/React.createElement(Surface, null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 60,
      textAlign: 'center',
      color: 'var(--fg-3)',
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 32,
    style: {
      marginBottom: 12,
      color: 'var(--fg-4)'
    }
  }), /*#__PURE__*/React.createElement("div", null, "\u0417\u0430\u0433\u043B\u0443\u0448\u043A\u0430 \xB7 \u043D\u0443\u0436\u043D\u044B \u0438\u0441\u0445\u043E\u0434\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u0432\u043E\u0441\u043F\u0440\u043E\u0438\u0437\u0432\u0435\u0434\u0435\u043D\u0438\u044F."))));
}
Object.assign(window, {
  LockedScreen,
  PlaceholderScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Placeholders.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/SettingsScreen.jsx
try { (() => {
/* Settings (Параметры) — organization form + tariff card. */

const SETTINGS_TABS = [{
  id: 'org',
  label: 'Организация',
  icon: 'building-2'
}, {
  id: 'usr',
  label: 'Пользователи',
  icon: 'users'
}, {
  id: 'int',
  label: 'Интеграции',
  icon: 'plug'
}, {
  id: 'tg',
  label: 'Настройки Telegram',
  icon: 'send'
}, {
  id: 'web',
  label: 'Веб сайт',
  icon: 'globe'
}, {
  id: 'ref',
  label: 'Справочники',
  icon: 'library'
}, {
  id: 'arc',
  label: 'Архив',
  icon: 'archive'
}];
function SettingsScreen() {
  const [tab, setTab] = React.useState('org');
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(Tabs, {
    items: SETTINGS_TABS,
    active: tab,
    onSelect: setTab
  }), /*#__PURE__*/React.createElement("div", {
    className: "settings"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "\u0418\u041F \u0421\u0415\u041C\u0415\u041D\u0415\u041D\u041A\u041E"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u0422\u043E\u043A\u0435\u043D (\u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C 7 \u0441\u0438\u043C\u0432\u043E\u043B\u043E\u0432)"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    defaultValue: "SEMEN",
    style: {
      maxWidth: 200
    }
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Field, {
    label: "\u041D\u0414\u0421 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0434\u043B\u044F \u043D\u043E\u0432\u044B\u0445 \u0442\u043E\u0432\u0430\u0440\u043E\u0432"
  }, /*#__PURE__*/React.createElement("input", {
    className: "input has-caret",
    defaultValue: "0",
    style: {
      maxWidth: 200
    }
  })), /*#__PURE__*/React.createElement("p", {
    className: "help",
    style: {
      marginTop: 6
    }
  }, "\u0431\u0435\u0437 \u041D\u0414\u0421 (0), 10% (0.1), 20% (0.2). \u041D\u0430 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u0442\u043E\u0432\u0430\u0440\u0430 \u043C\u043E\u0436\u043D\u043E \u0437\u0430\u0434\u0430\u0442\u044C \u0441\u0432\u043E\u044E \u0441\u0442\u0430\u0432\u043A\u0443.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "field-label",
    style: {
      display: 'block',
      marginBottom: 8
    }
  }, "\u0422\u0430\u0440\u0438\u0444"), /*#__PURE__*/React.createElement("div", {
    className: "tariff-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "tariff-name"
  }, "\u041F\u0420\u041E"), /*#__PURE__*/React.createElement("div", {
    className: "tariff-grid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-h"
  }, "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u0435\u043B\u044C"), /*#__PURE__*/React.createElement("div", {
    className: "col-h"
  }, "\u041B\u0438\u043C\u0438\u0442 \u043F\u043E \u0442\u0430\u0440\u0438\u0444\u0443"), /*#__PURE__*/React.createElement("div", {
    className: "col-h"
  }, "\u0421\u0435\u0439\u0447\u0430\u0441 \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435"), /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "\u0422\u043E\u0432\u0430\u0440\u044B"), "       ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "1 500"), "  ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "1 000"), /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438"), " ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "8"), "      ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "3"), /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "\u0421\u043A\u043B\u0430\u0434\u044B"), "       ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "10"), "     ", /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, "9")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "field-label",
    style: {
      marginBottom: 6,
      fontWeight: 700
    }
  }, "\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E\u0441\u0442\u0438 \u0442\u0430\u0440\u0438\u0444\u0430"), /*#__PURE__*/React.createElement("ul", {
    className: "bullets"
  }, /*#__PURE__*/React.createElement("li", null, "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043C\u0430\u0440\u043A\u0435\u0442\u043F\u043B\u0435\u0439\u0441\u043E\u0432: ", /*#__PURE__*/React.createElement("b", null, "\u0434\u0430")), /*#__PURE__*/React.createElement("li", null, "\u0421\u0430\u0439\u0442: ", /*#__PURE__*/React.createElement("b", null, "\u0434\u0430")), /*#__PURE__*/React.createElement("li", null, "\u041C\u043E\u0431\u0438\u043B\u044C\u043D\u043E\u0435 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435: ", /*#__PURE__*/React.createElement("b", null, "\u0434\u0430")), /*#__PURE__*/React.createElement("li", null, "\u0424\u043E\u0442\u043E \u0442\u043E\u0432\u0430\u0440\u043E\u0432: ", /*#__PURE__*/React.createElement("b", null, "\u0434\u0430")), /*#__PURE__*/React.createElement("li", null, "API: ", /*#__PURE__*/React.createElement("b", {
    className: "no"
  }, "\u043D\u0435\u0442")))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary"
  }, "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"))));
}
window.SettingsScreen = SettingsScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/SettingsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Shell.jsx
try { (() => {
/* App shell — composes Sidebar + TopBar + the currently-active screen. */

function Shell() {
  const [active, setActive] = React.useState('marketplace');
  const screen = (() => {
    switch (active) {
      case 'info':
        return /*#__PURE__*/React.createElement(InfoScreen, null);
      case 'tasks':
        return /*#__PURE__*/React.createElement(TasksScreen, null);
      case 'finance':
        return /*#__PURE__*/React.createElement(FinanceScreen, null);
      case 'settings':
        return /*#__PURE__*/React.createElement(SettingsScreen, null);
      case 'marketplace':
        return /*#__PURE__*/React.createElement(MarketplaceScreen, null);
      case 'website':
        return /*#__PURE__*/React.createElement(LockedScreen, null);
      case 'warehouse':
        return /*#__PURE__*/React.createElement(PlaceholderScreen, {
          title: "\u0421\u043A\u043B\u0430\u0434"
        });
      case 'sales':
        return /*#__PURE__*/React.createElement(PlaceholderScreen, {
          title: "\u041F\u0440\u043E\u0434\u0430\u0436\u0438"
        });
      case 'products':
        return /*#__PURE__*/React.createElement(PlaceholderScreen, {
          title: "\u0422\u043E\u0432\u0430\u0440\u044B"
        });
      default:
        return /*#__PURE__*/React.createElement(PlaceholderScreen, {
          title: "\u2014"
        });
    }
  })();
  return /*#__PURE__*/React.createElement("div", {
    className: "app"
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    onSelect: setActive
  }), /*#__PURE__*/React.createElement("div", {
    className: "main"
  }, /*#__PURE__*/React.createElement(TopBar, null), /*#__PURE__*/React.createElement("div", {
    className: "main-scroll"
  }, screen)));
}
window.Shell = Shell;

/* Mount */
ReactDOM.createRoot(document.getElementById('app')).render(/*#__PURE__*/React.createElement(Shell, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/Sidebar.jsx
try { (() => {
/* Left rail with brand block, primary nav, and a hidden-items divider. */

const NAV = [{
  id: 'info',
  label: 'Информация',
  icon: 'bar-chart-3'
}, {
  id: 'warehouse',
  label: 'Склад',
  icon: 'warehouse'
}, {
  id: 'sales',
  label: 'Продажи',
  icon: 'shopping-bag'
}, {
  id: 'products',
  label: 'Товары',
  icon: 'package'
}, {
  id: 'finance',
  label: 'Финансы',
  icon: 'russian-ruble'
}, {
  id: 'tasks',
  label: 'Задачи',
  icon: 'list-checks'
}, {
  id: 'settings',
  label: 'Параметры',
  icon: 'settings'
}];
const HIDDEN = [{
  id: 'website',
  label: 'Веб сайт',
  icon: 'globe'
}, {
  id: 'marketplace',
  label: 'Маркетплейс',
  icon: 'store',
  badge: 3
}];
function Sidebar({
  active,
  onSelect
}) {
  return /*#__PURE__*/React.createElement("aside", {
    className: "sb"
  }, /*#__PURE__*/React.createElement("div", {
    className: "sb-head"
  }, /*#__PURE__*/React.createElement("button", {
    className: "sb-collapse",
    title: "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-left",
    size: 16
  })), /*#__PURE__*/React.createElement("img", {
    className: "sb-logo",
    src: "../../assets/owls_logo.png",
    alt: "OWLS"
  })), NAV.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: 'sb-item' + (active === n.id ? ' active' : ''),
    onClick: () => onSelect(n.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, n.label), n.badge && /*#__PURE__*/React.createElement("span", {
    className: "sb-badge"
  }, n.badge))), /*#__PURE__*/React.createElement("div", {
    className: "sb-divider"
  }, "\u2014 \u0421\u043A\u0440\u044B\u0442\u044B\u0435 \u043F\u0443\u043D\u043A\u0442\u044B \u2014"), HIDDEN.map(n => /*#__PURE__*/React.createElement("button", {
    key: n.id,
    className: 'sb-item' + (active === n.id ? ' active' : ''),
    onClick: () => onSelect(n.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: n.icon,
    size: 18
  }), /*#__PURE__*/React.createElement("span", null, n.label), n.badge && /*#__PURE__*/React.createElement("span", {
    className: "sb-badge"
  }, n.badge))));
}
window.Sidebar = Sidebar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/Sidebar.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/TasksScreen.jsx
try { (() => {
/* Tasks screen — the Задачи table from the screenshot. */

const TASKS = [{
  id: 1,
  task: 'Раздел Задачи',
  date: '15.04.2026 16:06',
  who: 'Стас',
  author: 'Хетаг Туаев',
  status: 'Завершена',
  prio: 'Обычный',
  due: '15.04.2026 00:00'
}, {
  id: 2,
  task: 'Приёмка — по виду как закупка',
  date: '30.04.2026 18:44',
  who: 'Саша',
  author: 'Саша',
  status: 'В работе',
  prio: 'Обычный',
  due: '—'
}, {
  id: 3,
  task: 'Окошки должны шевелиться, они сей…',
  date: '30.04.2026 18:37',
  who: 'Стас',
  author: 'Саша',
  status: 'В работе',
  prio: 'Обычный',
  due: '—'
}, {
  id: 4,
  task: 'Закупка — Создание закупки — убрать …',
  date: '30.04.2026 18:35',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 5,
  task: 'Закупки — под датой сделать такое же …',
  date: '30.04.2026 18:33',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 6,
  task: 'Везде добавить кнопку Назад и чтобы…',
  date: '30.04.2026 18:30',
  who: 'Стас',
  author: 'Саша',
  status: 'На проверке',
  prio: 'Обычный',
  due: '—'
}, {
  id: 7,
  task: 'Закупка — Убрать «Создать приёмку»',
  date: '30.04.2026 18:22',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 8,
  task: 'Закупка — Создание закупки, Стоимос…',
  date: '30.04.2026 18:20',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 9,
  task: 'Закупка — При добавлении позиции в з…',
  date: '30.04.2026 18:19',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 10,
  task: 'Любые корректировки цены задним ч…',
  date: '30.04.2026 08:42',
  who: 'Саша',
  author: 'Хетаг Туаев',
  status: 'На проверке',
  prio: 'Обычный',
  due: '—'
}, {
  id: 11,
  task: 'Обучение — Убрать Поддержку',
  date: '29.04.2026 18:01',
  who: 'Стас',
  author: 'Саша',
  status: 'Завершена',
  prio: 'Обычный',
  due: '—'
}, {
  id: 12,
  task: 'Себестоимость',
  date: '29.04.2026 17:31',
  who: 'Саша',
  author: 'Саша',
  status: 'В работе',
  prio: 'Обычный',
  due: '—',
  tasksUnder: 3
}];
function TasksScreen() {
  return /*#__PURE__*/React.createElement("div", {
    className: "page"
  }, /*#__PURE__*/React.createElement(SubTabs, {
    items: [{
      id: 'tasks',
      label: 'Задачи',
      icon: 'list-checks'
    }],
    active: "tasks"
  }), /*#__PURE__*/React.createElement("div", {
    className: "filter-bar"
  }, /*#__PURE__*/React.createElement(Field, {
    label: "\u041F\u043E\u0438\u0441\u043A",
    style: {
      flex: 1,
      minWidth: 220
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input",
    placeholder: "\u041F\u043E\u0438\u0441\u043A \u2026"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    icon: "plus-circle"
  }, "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443"), /*#__PURE__*/React.createElement(Field, {
    label: "\u0421\u0442\u0430\u0442\u0443\u0441",
    style: {
      maxWidth: 180
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input has-caret",
    defaultValue: "\u0412\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442",
    style: {
      maxWidth: 180
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "input has-caret",
    defaultValue: "\u0412\u0441\u0435 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u044B"
  })), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    icon: "plus",
    size: "sm"
  })), /*#__PURE__*/React.createElement(DataTable, {
    columns: [{
      key: 'task',
      label: 'Задача',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", null, r.task, r.tasksUnder ? /*#__PURE__*/React.createElement("span", {
        className: "pill pill-danger",
        style: {
          marginLeft: 8
        }
      }, r.tasksUnder) : null)
    }, {
      key: 'date',
      label: 'Дата',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        className: "mono"
      }, r.date)
    }, {
      key: 'who',
      label: 'Исполнитель',
      filter: true
    }, {
      key: 'author',
      label: 'Постановщик',
      filter: true
    }, {
      key: 'status',
      label: 'Статус',
      filter: true,
      render: r => /*#__PURE__*/React.createElement(StatusPill, null, r.status)
    }, {
      key: 'prio',
      label: 'Приоритет',
      filter: true,
      render: r => /*#__PURE__*/React.createElement(StatusPill, null, r.prio)
    }, {
      key: 'due',
      label: 'Крайний срок',
      filter: true,
      render: r => /*#__PURE__*/React.createElement("span", {
        className: r.due === '—' ? 'muted' : 'mono'
      }, r.due)
    }],
    rows: TASKS
  }));
}
window.TasksScreen = TasksScreen;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/TasksScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/dashboard/TopBar.jsx
try { (() => {
/* Top toolbar: action pills on the left, right-rail icon buttons (assistant, theme,
   chat, profile). Notification bubble on the chat button is sticky. */

function TopBar() {
  return /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("button", {
    className: "pill-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 15
  }), "\u041F\u043E\u0438\u0441\u043A \u0442\u043E\u0432\u0430\u0440\u0430"), /*#__PURE__*/React.createElement("button", {
    className: "pill-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus-circle",
    size: 15
  }), "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u0432\u0430\u0440"), /*#__PURE__*/React.createElement("button", {
    className: "pill-btn"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "scan-barcode",
    size: 15
  }), "\u0421\u043A\u0430\u043D\u0435\u0440 \u0428\u041A"), /*#__PURE__*/React.createElement("button", {
    className: "plus-tab",
    title: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0432\u043A\u043B\u0430\u0434\u043A\u0443"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "plus",
    size: 16
  })), /*#__PURE__*/React.createElement("span", {
    className: "spacer"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "sparkles",
    title: "\u0410\u0441\u0441\u0438\u0441\u0442\u0435\u043D\u0442 OWLS"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "sun",
    title: "\u0422\u0435\u043C\u0430"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "message-square",
    bubble: "89",
    title: "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "user-circle-2",
    title: "\u041F\u0440\u043E\u0444\u0438\u043B\u044C"
  }));
}
window.TopBar = TopBar;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/dashboard/TopBar.jsx", error: String((e && e.message) || e) }); }

})();
