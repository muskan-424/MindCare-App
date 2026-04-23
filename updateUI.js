const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'AdminDashboardScreen.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add activeFilter state
code = code.replace(
  "const [delLoading, setDelLoading] = useState(false);",
  "const [delLoading, setDelLoading] = useState(false);\n  const [activeFilter, setActiveFilter] = useState(null);"
);

// 2. Change statsGrid to use TouchableOpacity
const oldStatsGrid = `<View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <View key={i} style={[ss.statTile, { borderTopColor: s.color }]}>
            <View style={[ss.statIconWrap, { backgroundColor: s.color + '1A' }]}>
              <MaterialIcons name={s.icon} size={18} color={s.color} />
            </View>
            <Text style={ss.statValue}>{s.value}</Text>
            <Text style={ss.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>`;

const newStatsGrid = `<View style={ss.statsGrid}>
        {STATS.map((s, i) => (
          <TouchableOpacity 
            key={i} 
            activeOpacity={0.7}
            onPress={() => setActiveFilter(activeFilter === s.label || s.label === 'Total Pending' ? null : s.label)}
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
      </View>`;

code = code.replace(oldStatsGrid, newStatsGrid);

// 3. Wrap sections
// Appointment Requests
code = code.replace(
  "{/* Appointment Requests */}",
  "{(!activeFilter || activeFilter === 'Consultations') && (\n      <View>\n      {/* Appointment Requests */}"
);
code = code.replace(
  "setAssignNote('');\n              }}\n            />\n          </View>\n        ))}",
  "setAssignNote('');\n              }}\n            />\n          </View>\n        ))}\n      </View>\n      )}"
);

// Risk Reports
code = code.replace(
  "{/* Risk Reports */}",
  "{(!activeFilter || activeFilter === 'Risk Reports') && (\n      <View>\n      {/* Risk Reports */}"
);
code = code.replace(
  "activeOpacity={0.8}\n              >\n                <MaterialIcons name=\"phone\" size={14} color=\"#fff\" style={{ marginRight: 5 }} />\n                <Text style={ss.actionButtonText}>Emergency Call</Text>\n              </TouchableOpacity>\n            </View>\n          </View>\n        ))}",
  "activeOpacity={0.8}\n              >\n                <MaterialIcons name=\"phone\" size={14} color=\"#fff\" style={{ marginRight: 5 }} />\n                <Text style={ss.actionButtonText}>Emergency Call</Text>\n              </TouchableOpacity>\n            </View>\n          </View>\n        ))}\n      </View>\n      )}"
);

// Emergency Contacts
code = code.replace(
  "{/* Emergency Contacts */}",
  "{(!activeFilter || activeFilter === 'Emergency Contacts') && (\n      <View>\n      {/* Emergency Contacts */}"
);
code = code.replace(
  "onPress={() => { setEcTarget(ec); setEcNote(''); setEcModal(true); }}\n            />\n          </View>\n        ))}",
  "onPress={() => { setEcTarget(ec); setEcNote(''); setEcModal(true); }}\n            />\n          </View>\n        ))}\n      </View>\n      )}"
);

// Wellness Plans
code = code.replace(
  "{/* Wellness Plans */}",
  "{(!activeFilter || activeFilter === 'Wellness Plans') && (\n      <View>\n      {/* Wellness Plans */}"
);
code = code.replace(
  "setPlanModal(true);\n              }}\n            />\n          </View>\n        ))}",
  "setPlanModal(true);\n              }}\n            />\n          </View>\n        ))}\n      </View>\n      )}"
);

// Deletion Requests
code = code.replace(
  "{/* Deletion Requests */}",
  "{(!activeFilter || activeFilter === 'Deletion Requests') && (\n      <View>\n      {/* Deletion Requests */}"
);
code = code.replace(
  "onPress={() => { setDelTarget(del); setDelNote(''); setDelModal(true); }}\n            />\n          </View>\n        ))}",
  "onPress={() => { setDelTarget(del); setDelNote(''); setDelModal(true); }}\n            />\n          </View>\n        ))}\n      </View>\n      )}"
);

fs.writeFileSync(filePath, code);
console.log('UI Interactivity added to Admin Dashboard!');
