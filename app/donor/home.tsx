import React, { useState } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Avatar, IconButton, Badge } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDonorAuth } from '../../context/DonorAuthContext';

const { width } = Dimensions.get('window');

interface ImpactStat {
  label: string;
  value: number;
  icon: string;
}

interface CommunityGoal {
  title: string;
  current: number;
  target: number;
}

interface TopDonor {
  id: string;
  name: string;
  meals: number;
}

interface UrgentNeed {
  ngoName: string;
  items: string[];
}

export default function DonorHomePage() {
  const router = useRouter();
  const { authState } = useDonorAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [isFirstTime] = useState(false);
  const [activeNavItem, setActiveNavItem] = useState('home');

  // Mock data
  const impactStats: ImpactStat[] = [
    { label: 'Meals Provided', value: 1250, icon: '🍽️' },
    { label: 'Donations Made', value: 45, icon: '📦' },
    { label: 'Families Helped', value: 320, icon: '👨‍👩‍👧‍👦' },
  ];

  const communityGoal: CommunityGoal = {
    title: 'Help Colombo reach 10,000 meals this month!',
    current: 7800,
    target: 10000,
  };

  const topDonors: TopDonor[] = [
    { id: '1', name: 'Sunrise Restaurant', meals: 450 },
    { id: '2', name: 'Green Grocery', meals: 380 },
    { id: '3', name: 'City Bakery', meals: 290 },
  ];

  const urgentNeed: UrgentNeed = {
    ngoName: 'Community Care Foundation',
    items: ['Fresh milk', 'Eggs', 'Rice'],
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setRefreshing(false);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Avatar.Text
            size={48}
            label={getInitials(authState.user?.name || 'D')}
            style={styles.avatar}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>
              Hello, {authState.user?.name?.split(' ')[0] || 'Donor'}!
            </Text>
            <Text style={styles.location}>📍 Colombo, LK</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <IconButton
              icon="bell-outline"
              size={24}
              iconColor="#2D3748"
              style={styles.iconButton}
            />
            {notificationCount > 0 && (
              <Badge style={styles.notificationBadge} size={18}>
                {notificationCount}
              </Badge>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderPrimaryCTA = () => (
    <View style={styles.ctaContainer}>
      <TouchableOpacity
        style={styles.primaryCTA}
        activeOpacity={0.8}
        onPress={() => router.push('/donor/create-donation')}
      >
        <View style={styles.ctaContent}>
          <View style={styles.ctaIconContainer}>
            <Text style={styles.ctaIcon}>+</Text>
          </View>
          <View style={styles.ctaTextContainer}>
            <Text style={styles.ctaTitle}>Create New Donation</Text>
            <Text style={styles.ctaSubtitle}>Share food, spread joy</Text>
          </View>
          <IconButton icon="chevron-right" size={24} iconColor="#718096" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryCTA} activeOpacity={0.8}>
        <IconButton icon="calendar-clock" size={20} iconColor="#FF8A50" />
        <Text style={styles.secondaryCTAText}>Schedule Recurring Pickup</Text>
        <IconButton icon="chevron-right" size={20} iconColor="#718096" />
      </TouchableOpacity>
    </View>
  );

  const renderFirstTimeWelcome = () => (
    <View style={styles.welcomeContainer}>
      <Card style={styles.welcomeCard}>
        <Card.Content style={styles.welcomeContent}>
          <View style={styles.welcomeImagePlaceholder}>
            {/* Image placeholder - add actual image here */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Welcome Image</Text>
            </View>
          </View>
          <Text style={styles.welcomeTitle}>Welcome to FoodLink!</Text>
          <Text style={styles.welcomeText}>
            Make your first donation to earn the 'First Step' badge and start
            making an impact in your community.
          </Text>
          <TouchableOpacity style={styles.welcomeButton} activeOpacity={0.8}>
            <Text style={styles.welcomeButtonText}>
              Make Your First Donation
            </Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </View>
  );

  const renderImpactDashboard = () => (
    <View style={styles.impactSection}>
      <Text style={styles.sectionTitle}>Your Impact</Text>
      <View style={styles.impactGrid}>
        {/* Meals Provided Card with Image */}
        <View style={styles.impactCard}>
          <Image
            source={{
              uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTuCygb7IFPzLiQ04wtS7g0d08rlEK5kgSWHJkTxF8ZU0cp4nKMhh6WfJj7bx7Ux4s4400&usqp=CAU',
            }}
            style={styles.impactImage}
            resizeMode="contain"
          />
          <Text style={styles.impactValue}>
            {impactStats[0].value.toLocaleString()}
          </Text>
          <Text style={styles.impactLabel}>{impactStats[0].label}</Text>
        </View>

        {/* Donations Made Card */}
        <View style={styles.impactCard}>
          <Image
            source={{
              uri: 'https://static.vecteezy.com/system/resources/previews/017/733/906/non_2x/food-donation-icon-design-free-vector.jpg',
            }}
            style={styles.impactImage}
            resizeMode="contain"
          />
          <Text style={styles.impactValue}>
            {impactStats[1].value.toLocaleString()}
          </Text>
          <Text style={styles.impactLabel}>{impactStats[1].label}</Text>
        </View>

        {/* Families Helped Card */}
        <View style={styles.impactCard}>
          <Image
            source={{
              uri: 'https://thumbs.dreamstime.com/b/w-mbs-163306348.jpg',
            }}
            style={styles.impactImage}
            resizeMode="contain"
          />
          <Text style={styles.impactValue}>
            {impactStats[2].value.toLocaleString()}
          </Text>
          <Text style={styles.impactLabel}>{impactStats[2].label}</Text>
        </View>
      </View>
    </View>
  );

  const renderCommunityGoal = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri: 'https://media.istockphoto.com/id/1332135331/vector/button-for-online-donate-line-icon-donation-with-click-linear-pictogram-support-and-give.jpg?s=612x612&w=0&k=20&c=nWbBTKXknStqgg4BFx78O8g-RImD9URctkbZ49Kgjqk=',
            }}
            style={styles.impactImage}
            resizeMode="contain"
          />
          <Text style={styles.cardTitle}>{communityGoal.title}</Text>
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${
                    (communityGoal.current / communityGoal.target) * 100
                  }%`,
                },
              ]}
            />
          </View>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {communityGoal.current.toLocaleString()} meals
            </Text>
            <Text style={styles.progressTarget}>
              of {communityGoal.target.toLocaleString()}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  const renderLeaderboard = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Image
            source={{
              uri: 'https://t4.ftcdn.net/jpg/03/57/78/77/360_F_357787759_lDn9krIQ1eruZNSgeD00bpdB3UBSLLhx.jpg',
            }}
            style={styles.impactImage}
            resizeMode="contain"
          />
          <Text style={styles.cardTitle}> Top Donors This Week</Text>
        </View>
        {topDonors.map((donor, index) => (
          <View key={donor.id} style={styles.leaderboardItem}>
            <View style={styles.leaderboardLeft}>
              <View style={styles.rankBadge}>
                <Text style={styles.leaderboardRank}>{index + 1}</Text>
              </View>
              <Avatar.Text
                size={40}
                label={getInitials(donor.name)}
                style={styles.leaderboardAvatar}
              />
              <Text style={styles.leaderboardName}>{donor.name}</Text>
            </View>
            <View style={styles.mealsContainer}>
              <Text style={styles.leaderboardMeals}>{donor.meals}</Text>
              <Text style={styles.mealsLabel}>meals</Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );

  const renderUrgentNeed = () => (
    <Card style={styles.urgentCard}>
      <Card.Content>
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeIcon}>🚨</Text>
          <Text style={styles.urgentBadgeText}>URGENT NEED</Text>
        </View>
        <Text style={styles.urgentNgo}>{urgentNeed.ngoName}</Text>
        <View style={styles.urgentItemsContainer}>
          {urgentNeed.items.map((item, index) => (
            <View key={index} style={styles.urgentItemChip}>
              <Text style={styles.urgentItemText}>{item}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.urgentButton} activeOpacity={0.8}>
          <Text style={styles.urgentButtonText}>Donate Now</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  const renderImpactStory = () => (
    <Card style={styles.sectionCard}>
      <Card.Content>
        <View style={styles.storyImagePlaceholder}>
          {/* Image placeholder - add actual image here */}
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderText}>Success Story Image</Text>
          </View>
        </View>
        <View style={styles.storyBadge}>
          <Text style={styles.storyBadgeText}>Success Story</Text>
        </View>
        <Text style={styles.storyTitle}>
          How Your Donations Helped the Silva Family
        </Text>
        <TouchableOpacity style={styles.storyButton}>
          <Text style={styles.storyButtonText}>Read More</Text>
          <IconButton icon="chevron-right" size={20} iconColor="#FF8A50" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );

  /*const renderQuickAccess = () => (
    <View style={styles.quickAccessSection}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.quickAccessGrid}>
        <TouchableOpacity style={styles.quickAccessItem} activeOpacity={0.7}>
          <View style={styles.quickAccessIconBg}>
            <IconButton icon="history" size={24} iconColor="#FF8A50" />
          </View>
          <Text style={styles.quickAccessText}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} activeOpacity={0.7}>
          <View style={styles.quickAccessIconBg}>
            <IconButton icon="calendar-sync" size={24} iconColor="#FF8A50" />
          </View>
          <Text style={styles.quickAccessText}>Recurring</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} activeOpacity={0.7}>
          <View style={styles.quickAccessIconBg}>
            <IconButton icon="file-document" size={24} iconColor="#FF8A50" />
          </View>
          <Text style={styles.quickAccessText}>Receipts</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAccessItem} activeOpacity={0.7}>
          <View style={styles.quickAccessIconBg}>
            <IconButton icon="medal" size={24} iconColor="#FF8A50" />
          </View>
          <Text style={styles.quickAccessText}>Badges</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
*/
  const renderNavigationBar = () => {
    const navItems = [
      {
        key: 'home',
        icon: 'home',
        label: 'Home',
        route: '/donor/home',
      },
      {
        key: 'history',
        icon: 'history',
        label: 'History',
        route: '/donor/history',
      },
      {
        key: 'recurring',
        icon: 'calendar-sync',
        label: 'Recurring',
        route: '/donor/recurring',
      },
      {
        key: 'profile',
        icon: 'account',
        label: 'Profile',
        route: '/donor/profile',
      },
    ];
    return (
      <View style={styles.navigationBar}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => {
              setActiveNavItem(item.key);
              if (item.route) {
                router.push(item.route);
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
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF8A50']}
            tintColor="#FF8A50"
          />
        }
      >
        {renderPrimaryCTA()}
        {isFirstTime ? renderFirstTimeWelcome() : renderImpactDashboard()}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>Community & Opportunities</Text>
          {renderCommunityGoal()}
          {renderLeaderboard()}
          {renderUrgentNeed()}
          {renderImpactStory()}
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
      {renderNavigationBar()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: '#FF8A50',
  },
  headerInfo: {
    marginLeft: 14,
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 2,
  },
  location: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  headerRight: {
    position: 'relative',
  },
  notificationButton: {
    position: 'relative',
  },
  iconButton: {
    margin: 0,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FF8A50',
    fontSize: 10,
    fontWeight: '700',
  },
  ctaContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  primaryCTA: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF8A50',
    marginBottom: 12,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  ctaIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF8A50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  ctaIcon: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 2,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  secondaryCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryCTAText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
  },
  impactSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 16,
  },
  impactGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  impactCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  impactImage: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  impactIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF8A50',
    marginBottom: 4,
  },
  impactLabel: {
    fontSize: 12,
    color: '#718096',
    fontWeight: '500',
    textAlign: 'center',
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  welcomeCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  welcomeContent: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeImagePlaceholder: {
    width: '100%',
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#F7FAFC',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  placeholderText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 15,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  welcomeButton: {
    width: '100%',
    backgroundColor: '#FF8A50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  welcomeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    flex: 1,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 8,
    backgroundColor: '#F7FAFC',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 8,
    backgroundColor: '#FF8A50',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF8A50',
  },
  progressTarget: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F7FAFC',
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  leaderboardRank: {
    fontSize: 14,
    fontWeight: '700',
    color: '#718096',
  },
  leaderboardAvatar: {
    backgroundColor: '#FFE4CC',
    marginRight: 12,
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    flex: 1,
  },
  mealsContainer: {
    alignItems: 'flex-end',
  },
  leaderboardMeals: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8A50',
  },
  mealsLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#718096',
    marginTop: 2,
  },
  urgentCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  urgentBadgeIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  urgentBadgeText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 11,
  },
  urgentNgo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
  },
  urgentItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  urgentItemChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  urgentItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
  urgentButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  urgentButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyImagePlaceholder: {
    width: '100%',
    marginBottom: 12,
  },
  storyBadge: {
    backgroundColor: '#F7FAFC',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 10,
  },
  storyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#718096',
  },
  storyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 12,
    lineHeight: 22,
  },
  storyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  storyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF8A50',
  },
  navigationBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 8,
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
  bottomSpacer: {
    height: 20,
  },
});
