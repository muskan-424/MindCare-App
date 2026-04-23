const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'AdminDashboardScreen.js');
let code = fs.readFileSync(filePath, 'utf8');

// Helper to inject stats grid UI
const getStatsGridString = (mapPrefix = '') => `
      {/* ── Overview Stats Grid ── */}
      <View style={ss.overviewHeader}>
        <Text style={ss.overviewTitle}>Overview</Text>
      </View>
      <View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === s.label || s.label.includes('Total') || s.label.includes('All') ? null : s.label)}
            style={[
              ss.statTile, 
              { borderTopColor: s.color },
              activeFilter === s.label && { backgroundColor: s.color + '22', transform: [{ scale: 1.02 }] }
            ]}
          >
            <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
              <MaterialIcons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={ss.statValue}>{s.value}</Text>
            <Text style={ss.statLabel}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={ss.workQueueHeader}>
        <View style={ss.workQueueLine} />
        <Text style={ss.workQueueLabel}>Filtered Results</Text>
        <View style={ss.workQueueLine} />
      </View>
`;

/** 1. TherapistsTab **/
code = code.replace(
  "const [therapists, setTherapists] = useState([]);",
  "const [therapists, setTherapists] = useState([]);\n  const [activeFilter, setActiveFilter] = useState(null);"
);
code = code.replace(
  "    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>\n      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>",
  `    <ScrollView contentContainerStyle={ss.tabScroll} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>`
);
code = code.replace(
  "      <Text style={[ss.cardMeta, { marginBottom: 16 }]}>{therapists.length} therapist{therapists.length !== 1 ? 's' : ''} registered</Text>\n\n      {therapists.length === 0",
  `
  const STATS = [
    { label: 'All Therapists', value: therapists.length, icon: 'groups', color: D.primaryLight },
    { label: 'Active', value: therapists.filter(t => t.active !== false).length, icon: 'check-circle', color: D.success },
    { label: 'Inactive', value: therapists.filter(t => t.active === false).length, icon: 'block', color: D.dangerDeep },
  ];
${getStatsGridString()}
      {therapists.length === 0`
);
code = code.replace(
  ": therapists.map(t => (",
  `: therapists.filter(t => {
          if (!activeFilter || activeFilter === 'All Therapists') return true;
          if (activeFilter === 'Active') return t.active !== false;
          if (activeFilter === 'Inactive') return t.active === false;
          return true;
        }).map(t => (`
);


/** 2. ResourcesTab **/
code = code.replace(
  "const [resources, setResources] = useState([]);",
  "const [resources, setResources] = useState([]);\n  const [activeFilter, setActiveFilter] = useState(null);"
);
code = code.replace(
  "      <Text style={[ss.cardMeta, { marginBottom: 16 }]}>{resources.length} active resource{resources.length !== 1 ? 's' : ''} in library</Text>\n\n      {resources.length === 0",
  `
  const STATS = [
    { label: 'Total Resources', value: resources.length, icon: 'library-books', color: D.primaryLight },
    { label: 'Articles', value: resources.filter(r => r.type === 'article').length, icon: 'article', color: D.accent },
    { label: 'Videos', value: resources.filter(r => r.type === 'video').length, icon: 'play-circle', color: D.danger },
    { label: 'Exercises', value: resources.filter(r => r.type === 'exercise').length, icon: 'fitness-center', color: D.success },
  ];
${getStatsGridString()}
      {resources.length === 0`
);
code = code.replace(
  ": resources.map(r => (",
  `: resources.filter(r => {
          if (!activeFilter || activeFilter === 'Total Resources') return true;
          if (activeFilter === 'Articles') return r.type === 'article';
          if (activeFilter === 'Videos') return r.type === 'video';
          if (activeFilter === 'Exercises') return r.type === 'exercise';
          return true;
        }).map(r => (`
);


/** 3. UsersTab **/
code = code.replace(
  "const [users, setUsers] = useState([]);",
  "const [users, setUsers] = useState([]);\n  const [activeFilter, setActiveFilter] = useState(null);"
);
code = code.replace(
  "      <Text style={[ss.cardMeta, { marginBottom: 16 }]}>{users.length} total account{users.length !== 1 ? 's' : ''}</Text>\n\n      <FlatList",
  `
  const STATS = [
    { label: 'Total Accounts', value: users.length, icon: 'people', color: D.primaryLight },
    { label: 'Patients', value: users.filter(u => u.role === 'user').length, icon: 'person', color: D.accent },
    { label: 'Clinicians', value: users.filter(u => u.role === 'clinician').length, icon: 'medical-services', color: D.success },
    { label: 'Suspended', value: users.filter(u => u.suspended).length, icon: 'gavel', color: D.dangerDeep },
  ];
${getStatsGridString()}
      <FlatList`
);
code = code.replace(
  "data={users}",
  `data={users.filter(u => {
          if (!activeFilter || activeFilter === 'Total Accounts') return true;
          if (activeFilter === 'Patients') return u.role === 'user';
          if (activeFilter === 'Clinicians') return u.role === 'clinician';
          if (activeFilter === 'Suspended') return !!u.suspended;
          return true;
        })}`
);


/** 4. NotificationsTab **/
code = code.replace(
  "const [notifications, setNotifications] = useState([]);",
  "const [notifications, setNotifications] = useState([]);\n  const [activeFilter, setActiveFilter] = useState(null);"
);
code = code.replace(
  "      <Text style={[ss.cardMeta, { paddingHorizontal: 16, marginBottom: 8 }]}>{total} broadcast{total !== 1 ? 's' : ''} sent</Text>\n\n      <FlatList",
  `
  const STATS = [
    { label: 'Total Broadcasts', value: notifications.length, icon: 'campaign', color: D.primaryLight },
    { label: 'To All Users', value: notifications.filter(n => n.audience === 'all_users').length, icon: 'people', color: D.accent },
    { label: 'To Therapists', value: notifications.filter(n => n.audience === 'therapists').length, icon: 'medical-services', color: D.success },
  ];
  const renderedStats = (
    <View style={{ paddingHorizontal: 16 }}>
      ${getStatsGridString()}
    </View>
  );
      <Text style={[ss.cardMeta, { paddingHorizontal: 16, marginBottom: 8 }]}>{total} broadcast{total !== 1 ? 's' : ''} sent</Text>
      {renderedStats}
      <FlatList`
);
// Filter FlatList for NotificationsTab
code = code.replace(
  "data={notifications}",
  `data={notifications.filter(n => {
          if (!activeFilter || activeFilter === 'Total Broadcasts') return true;
          if (activeFilter === 'To All Users') return n.audience === 'all_users';
          if (activeFilter === 'To Therapists') return n.audience === 'therapists';
          return true;
        })}`
);

/** 5. AuditTab **/
code = code.replace(
  "const [logs, setLogs] = useState([]);",
  "const [logs, setLogs] = useState([]);\n  const [activeFilter, setActiveFilter] = useState(null);"
);
code = code.replace(
  "      <Text style={[ss.cardMeta, { paddingHorizontal: 16, marginBottom: 8 }]}>{total} event{total !== 1 ? 's' : ''} recorded</Text>\n\n      <FlatList",
  `
  const STATS = [
    { label: 'All Logs', value: logs.length, icon: 'history', color: D.primaryLight },
    { label: 'Auth Events', value: logs.filter(l => ['login','register'].includes(l.actionType)).length, icon: 'login', color: D.accent },
    { label: 'Admin Actions', value: logs.filter(l => ['create','delete','update'].includes(l.actionType) || l.performedByModel === 'Admin').length, icon: 'gavel', color: D.danger },
  ];
  const renderedAuditStats = (
    <View style={{ paddingHorizontal: 16 }}>
      ${getStatsGridString()}
    </View>
  );
      <Text style={[ss.cardMeta, { paddingHorizontal: 16, marginBottom: 8 }]}>{total} event{total !== 1 ? 's' : ''} recorded</Text>
      {renderedAuditStats}
      <FlatList`
);
// Filter FlatList for AuditTab
code = code.replace(
  "data={logs}",
  `data={logs.filter(l => {
          if (!activeFilter || activeFilter === 'All Logs') return true;
          if (activeFilter === 'Auth Events') return ['login','register'].includes(l.actionType);
          if (activeFilter === 'Admin Actions') return ['create','delete','update'].includes(l.actionType) || l.performedByModel === 'Admin';
          return true;
        })}`
);

fs.writeFileSync(filePath, code);
console.log('Successfully patched all Admin tabs with interactive Overview grids!');
