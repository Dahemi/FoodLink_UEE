import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useRouter, usePathname } from 'expo-router';

interface NavItem {
  key: string;
  icon: string;
  label: string;
  route: string;
}

export default function VolunteerBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      key: 'dashboard',
      icon: 'view-dashboard',
      label: 'Dashboard',
      route: '/volunteer/dashboard',
    },
    {
      key: 'schedule',
      icon: 'calendar-clock',
      label: 'Schedule',
      route: '/volunteer/schedule',
    },
    {
      key: 'completed',
      icon: 'check-circle',
      label: 'Completed',
      route: '/volunteer/completed-tasks',
    },
    {
      key: 'profile',
      icon: 'account',
      label: 'Profile',
      route: '/volunteer/profile',
    },
  ];

  const getActiveKey = () => {
    if (pathname.includes('/volunteer/dashboard')) return 'dashboard';
    if (pathname.includes('/volunteer/schedule')) return 'schedule';
    if (pathname.includes('/volunteer/completed-tasks')) return 'completed';
    if (pathname.includes('/volunteer/profile')) return 'profile';
    return 'dashboard';
  };

  const activeNavItem = getActiveKey();

  return (
    <View style={styles.navigationBar}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.navItem}
          onPress={() => {
            if (pathname !== item.route) {
              router.push(item.route as any);
            }
          }}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.navIconContainer,
              activeNavItem === item.key && styles.navIconContainerActive,
            ]}
          >
            <IconButton
              icon={item.icon}
              size={24}
              iconColor={activeNavItem === item.key ? '#FF8A50' : '#718096'}
              style={styles.navIcon}
            />
          </View>
          <Text
            style={[
              styles.navLabel,
              activeNavItem === item.key && styles.navLabelActive,
            ]}
          >
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  navIconContainerActive: {
    backgroundColor: '#FFF5E6',
  },
  navIcon: {
    margin: 0,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#718096',
    textAlign: 'center',
  },
  navLabelActive: {
    color: '#FF8A50',
    fontWeight: '700',
  },
});
