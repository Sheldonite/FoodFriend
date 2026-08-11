import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Tab = 'Home' | 'Inventory' | 'Discover' | 'Reviews' | 'Settings';
type Storage = 'Pantry' | 'Fridge' | 'Freezer' | 'Spices';

type InventoryItem = {
  id: string;
  name: string;
  category: Storage;
  quantity: string;
  calories: number;
  protein: number;
  fiber: number;
  healthScore: number;
  avoid?: boolean;
  alternative?: string;
};

const colors = {
  ink: '#121923',
  muted: '#73808D',
  line: '#E8ECEF',
  canvas: '#F7F9F8',
  card: '#FFFFFF',
  green: '#5EAD52',
  greenDark: '#2B7A4A',
  orange: '#F4A51C',
  red: '#E74D45',
  lavender: '#EEEAFB',
};

const allergens = [
  'Milk', 'Eggs', 'Peanuts', 'Tree nuts', 'Soy', 'Wheat', 'Fish', 'Shellfish',
  'Sesame', 'Mustard', 'Celery', 'Lupin', 'Molluscs', 'Sulphites', 'Gluten',
  'Corn', 'Oats', 'Rye', 'Barley', 'Buckwheat', 'Coconut', 'Gelatin', 'Kiwi',
  'Banana', 'Avocado', 'Sulfites', 'Pork', 'Beef', 'Chicken', 'Legumes',
];

const initialInventory: InventoryItem[] = [
  { id: '1', name: 'Spinach', category: 'Fridge', quantity: '1 bag', calories: 23, protein: 3, fiber: 2, healthScore: 96 },
  { id: '2', name: 'Greek yogurt', category: 'Fridge', quantity: '3 cups', calories: 120, protein: 17, fiber: 0, healthScore: 87 },
  { id: '3', name: 'Chickpeas', category: 'Pantry', quantity: '2 cans', calories: 269, protein: 15, fiber: 12, healthScore: 92 },
  { id: '4', name: 'Frozen berries', category: 'Freezer', quantity: '1 bag', calories: 70, protein: 1, fiber: 4, healthScore: 94 },
  { id: '5', name: 'White bread', category: 'Pantry', quantity: '½ loaf', calories: 266, protein: 9, fiber: 2, healthScore: 48, avoid: true, alternative: 'Whole grain bread' },
  { id: '6', name: 'Smoked paprika', category: 'Spices', quantity: '1 jar', calories: 6, protein: 0, fiber: 1, healthScore: 85 },
];

const reviews = [
  { id: '1', name: 'Green Table Kitchen', type: 'Restaurant', rating: 5, note: 'Quiet corner seating and great gluten-free choices.', tags: ['Low lighting', 'Calm'] },
  { id: '2', name: 'Harvest Bowl', type: 'App recommendation', rating: 4, note: 'Easy menu, clear ingredients, gentle atmosphere.', tags: ['Parking', 'Low lighting'] },
  { id: '3', name: 'Taco Norte', type: 'Restaurant', rating: 3, note: 'Delicious, but the music can get loud after 7pm.', tags: ['Loud at night'] },
];

const persistenceKey = '@foodfriend/local-state';

const iconForTab: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Inventory: 'cube-outline',
  Discover: 'compass-outline',
  Reviews: 'star-outline',
  Settings: 'options-outline',
};

function Icon({ name, size = 20, color = colors.ink }: { name: keyof typeof Ionicons.glyphMap; size?: number; color?: string }) {
  return <Ionicons name={name} size={size} color={color} />;
}

function Pill({ label, selected, onPress, tone = 'green' }: { label: string; selected?: boolean; onPress?: () => void; tone?: 'green' | 'red' | 'orange' }) {
  const toneColor = tone === 'red' ? colors.red : tone === 'orange' ? colors.orange : colors.greenDark;
  return (
    <Pressable onPress={onPress} style={[styles.pill, selected && { backgroundColor: toneColor, borderColor: toneColor }]}>
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && <Pressable onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable>}
    </View>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [showAdd, setShowAdd] = useState(false);
  const [showScan, setShowScan] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [search, setSearch] = useState('');
  const [storageFilter, setStorageFilter] = useState<'All' | Storage>('All');
  const [newItem, setNewItem] = useState({ name: '', quantity: '1 item', category: 'Pantry' as Storage });
  const [sensoryMode, setSensoryMode] = useState(true);
  const [sensoryNeeds, setSensoryNeeds] = useState(['Low Lighting', 'Calm Atmosphere']);
  const [selectedAllergens, setSelectedAllergens] = useState(['Milk', 'Peanuts']);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(persistenceKey)
      .then((saved) => {
        if (!saved) return;
        const state = JSON.parse(saved) as Partial<{
          inventory: InventoryItem[];
          sensoryMode: boolean;
          sensoryNeeds: string[];
          selectedAllergens: string[];
        }>;
        if (state.inventory) setInventory(state.inventory);
        if (typeof state.sensoryMode === 'boolean') setSensoryMode(state.sensoryMode);
        if (state.sensoryNeeds) setSensoryNeeds(state.sensoryNeeds);
        if (state.selectedAllergens) setSelectedAllergens(state.selectedAllergens);
      })
      .catch(() => undefined)
      .finally(() => setIsHydrated(true));
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    AsyncStorage.setItem(persistenceKey, JSON.stringify({ inventory, sensoryMode, sensoryNeeds, selectedAllergens })).catch(() => undefined);
  }, [inventory, sensoryMode, sensoryNeeds, selectedAllergens, isHydrated]);

  const healthyCount = inventory.filter((item) => !item.avoid).length;
  const filteredInventory = useMemo(() => inventory.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = storageFilter === 'All' || item.category === storageFilter;
    return matchesSearch && matchesFilter;
  }), [inventory, search, storageFilter]);

  function runScan() {
    setScanMessage('Scanning your photo…');
    setTimeout(() => {
      setScanMessage('Found: spinach, Greek yogurt, and chickpeas.');
      setInventory((items) => items.map((item) => item.name === 'Spinach' ? { ...item, quantity: '2 bags' } : item));
    }, 700);
  }

  function addItem() {
    if (!newItem.name.trim()) return;
    setInventory((items) => [...items, {
      id: Date.now().toString(), name: newItem.name.trim(), quantity: newItem.quantity || '1 item', category: newItem.category,
      calories: 100, protein: 4, fiber: 2, healthScore: 75,
    }]);
    setNewItem({ name: '', quantity: '1 item', category: 'Pantry' });
    setShowAdd(false);
  }

  function toggleSensoryNeed(need: string) {
    setSensoryNeeds((needs) => needs.includes(need) ? needs.filter((item) => item !== need) : [...needs, need]);
  }

  function toggleAllergen(allergen: string) {
    setSelectedAllergens((items) => items.includes(allergen) ? items.filter((item) => item !== allergen) : [...items, allergen]);
  }

  function renderHome() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <View><Text style={styles.eyebrow}>MONDAY, OCTOBER 14</Text><Text style={styles.greeting}>Good morning, Alex</Text></View>
          <View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View>
        </View>
        <View style={styles.hero}>
          <View style={styles.heroCopy}><Text style={styles.heroEyebrow}>YOUR FOOD FRIEND</Text><Text style={styles.heroTitle}>Make a good choice feel easy.</Text><Text style={styles.heroBody}>Use what you have, find what fits, and feel good about the decision.</Text><Pressable style={styles.heroButton} onPress={() => setActiveTab('Discover')}><Text style={styles.heroButtonText}>Find something good</Text><Icon name="arrow-forward" size={16} color={colors.ink} /></Pressable></View>
          <View style={styles.heroBadge}><Icon name="restaurant-outline" size={42} color={colors.orange} /><Text style={styles.heroBadgeText}>GOOD</Text></View>
        </View>
        <SectionTitle title="Your food pulse" action="View details" onAction={() => setActiveTab('Inventory')} />
        <View style={styles.statsRow}>
          <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#E6F5E3' }]}><Icon name="leaf-outline" color={colors.greenDark} /></View><Text style={styles.statNumber}>{healthyCount}</Text><Text style={styles.statLabel}>good choices</Text></View>
          <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#FFF0D4' }]}><Icon name="nutrition-outline" color={colors.orange} /></View><Text style={styles.statNumber}>{inventory.length}</Text><Text style={styles.statLabel}>items tracked</Text></View>
          <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: '#FDE6E4' }]}><Icon name="heart-outline" color={colors.red} /></View><Text style={styles.statNumber}>82%</Text><Text style={styles.statLabel}>on your plan</Text></View>
        </View>
        <SectionTitle title="Quick actions" />
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickCard} onPress={() => setShowScan(true)}><View style={[styles.quickIcon, { backgroundColor: '#FFF0D4' }]}><Icon name="scan-outline" color={colors.orange} size={23} /></View><Text style={styles.quickTitle}>Scan groceries</Text><Text style={styles.quickBody}>Photo → pantry</Text></Pressable>
          <Pressable style={styles.quickCard} onPress={() => setShowAdd(true)}><View style={[styles.quickIcon, { backgroundColor: '#E6F5E3' }]}><Icon name="add" color={colors.greenDark} size={23} /></View><Text style={styles.quickTitle}>Add an item</Text><Text style={styles.quickBody}>Keep it current</Text></Pressable>
          <Pressable style={styles.quickCard} onPress={() => setActiveTab('Reviews')}><View style={[styles.quickIcon, { backgroundColor: '#FDE6E4' }]}><Icon name="star-outline" color={colors.red} size={23} /></View><Text style={styles.quickTitle}>Rate a place</Text><Text style={styles.quickBody}>Help your people</Text></Pressable>
          <Pressable style={styles.quickCard} onPress={() => setActiveTab('Settings')}><View style={[styles.quickIcon, { backgroundColor: colors.lavender }]}><Icon name="options-outline" color="#7565B5" size={23} /></View><Text style={styles.quickTitle}>Tune FoodFriend</Text><Text style={styles.quickBody}>Make it yours</Text></Pressable>
        </View>
        <SectionTitle title="Made for you" action="See all" onAction={() => setActiveTab('Discover')} />
        <View style={styles.recommendCard}><View style={styles.recommendArt}><Text style={styles.recommendEmoji}>🥗</Text></View><View style={styles.recommendCopy}><Text style={styles.recommendLabel}>PANTRY MATCH · 18 MIN</Text><Text style={styles.recommendTitle}>Chickpea crunch bowl</Text><Text style={styles.recommendBody}>Uses 4 items you already have · 31g protein</Text><View style={styles.tagRow}><Pill label="Gluten-free" /><Pill label="Calm prep" tone="orange" /></View></View><Icon name="chevron-forward" size={20} color={colors.muted} /></View>
        <View style={styles.sensoryNotice}><Icon name="sparkles-outline" size={19} color="#7565B5" /><Text style={styles.sensoryText}>{sensoryMode ? 'Recommendations are tuned for your sensory needs.' : 'Turn on sensory-friendly recommendations in Settings.'}</Text></View>
      </ScrollView>
    );
  }

  function renderInventory() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}><View><Text style={styles.eyebrow}>YOUR FOOD, ORGANIZED</Text><Text style={styles.screenTitle}>Inventory</Text></View><Pressable style={styles.roundButton} onPress={() => setShowAdd(true)}><Icon name="add" color={colors.card} /></Pressable></View>
        <View style={styles.searchBox}><Icon name="search-outline" color={colors.muted} /><TextInput placeholder="Search your food" placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} style={styles.searchInput} /></View>
        <View style={styles.filterRow}>{(['All', 'Pantry', 'Fridge', 'Freezer', 'Spices'] as const).map((filter) => <Pill key={filter} label={filter} selected={storageFilter === filter} onPress={() => setStorageFilter(filter)} />)}</View>
        <Pressable style={styles.scanBanner} onPress={() => setShowScan(true)}><View style={styles.scanBannerIcon}><Icon name="scan-outline" color={colors.orange} size={24} /></View><View style={{ flex: 1 }}><Text style={styles.scanTitle}>Snapshot your shelves</Text><Text style={styles.scanBody}>OCR + item recognition will update quantities for you.</Text></View><Icon name="chevron-forward" color={colors.orange} /></Pressable>
        <SectionTitle title={`${filteredInventory.length} items`} action="Nutrition view" onAction={() => Alert.alert('Nutrition at a glance', 'Your current inventory averages 82% healthy choices, 12g fiber per tracked serving, and 14g protein.')} />
        {filteredInventory.map((item) => <View key={item.id} style={styles.inventoryCard}><View style={[styles.foodIcon, { backgroundColor: item.avoid ? '#FDE6E4' : '#E6F5E3' }]}><Text style={styles.foodEmoji}>{item.category === 'Spices' ? '🫙' : item.category === 'Freezer' ? '❄️' : item.category === 'Fridge' ? '🥬' : '🥫'}</Text></View><View style={{ flex: 1 }}><View style={styles.inventoryTitleRow}><Text style={styles.inventoryName}>{item.name}</Text>{item.avoid && <View style={styles.avoidBadge}><Text style={styles.avoidText}>AVOID</Text></View>}</View><Text style={styles.inventoryMeta}>{item.category} · {item.quantity}</Text><Text style={styles.inventoryNutrition}>{item.calories} cal  ·  {item.protein}g protein  ·  {item.fiber}g fiber</Text>{item.alternative && <Text style={styles.alternative}><Icon name="swap-horizontal-outline" size={13} color={colors.greenDark} /> Try {item.alternative}</Text>}</View><View style={styles.score}><Text style={styles.scoreNumber}>{item.healthScore}</Text><Text style={styles.scoreLabel}>score</Text></View></View>)}
      </ScrollView>
    );
  }

  function renderDiscover() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}><View><Text style={styles.eyebrow}>OPTIONS THAT FIT</Text><Text style={styles.screenTitle}>Discover</Text></View><View style={styles.matchBadge}><Icon name="sparkles" size={15} color={colors.orange} /><Text style={styles.matchText}>92% match</Text></View></View>
        <Text style={styles.intro}>Based on your inventory, avoid list, and {sensoryMode ? 'sensory preferences' : 'current preferences'}.</Text>
        <View style={styles.discoveryFeature}><Text style={styles.featureEyebrow}>TOP PICK FOR TONIGHT</Text><Text style={styles.featureTitle}>Warm, gentle, and ready in 20 minutes.</Text><Text style={styles.featureBody}>Roasted chickpea + spinach bowl with yogurt drizzle.</Text><View style={styles.featureFooter}><Pill label="4 pantry items" /><Pill label="Low lighting friendly" tone="orange" /><Pressable style={styles.arrowCircle} onPress={() => Alert.alert('Recipe saved', 'Chickpea crunch bowl was added to your FoodFriend list.')}><Icon name="arrow-forward" color={colors.ink} size={18} /></Pressable></View></View>
        <SectionTitle title="Other good fits" action="Adjust" onAction={() => setActiveTab('Settings')} />
        {[['Lemon herb salmon', '30 min · 36g protein', '🐟', 'Fish'], ['Berry yogurt crunch', '8 min · 12g protein', '🫐', 'Breakfast'], ['Smoky bean tacos', '22 min · 18g protein', '🌮', 'Plant-based']].map(([title, meta, emoji, label]) => <View key={title} style={styles.discoveryRow}><View style={styles.discoveryEmoji}><Text style={{ fontSize: 28 }}>{emoji}</Text></View><View style={{ flex: 1 }}><Text style={styles.discoveryLabel}>{label}</Text><Text style={styles.discoveryTitle}>{title}</Text><Text style={styles.discoveryMeta}>{meta}</Text></View><Icon name="heart-outline" color={colors.red} size={21} /></View>)}
        <View style={styles.avoidCallout}><Icon name="shield-checkmark-outline" color={colors.greenDark} size={22} /><View style={{ flex: 1 }}><Text style={styles.avoidCalloutTitle}>Your avoid list is working</Text><Text style={styles.avoidCalloutBody}>We filtered out 2 options containing your allergens.</Text></View><Pressable onPress={() => setActiveTab('Settings')}><Text style={styles.link}>Edit</Text></Pressable></View>
      </ScrollView>
    );
  }

  function renderReviews() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}><View><Text style={styles.eyebrow}>YOUR COMMUNITY</Text><Text style={styles.screenTitle}>Reviews</Text></View><Pressable style={styles.roundButton} onPress={() => Alert.alert('Add a review', 'Restaurant and recommendation review form coming next.')}><Icon name="create-outline" color={colors.card} /></Pressable></View>
        <View style={styles.reviewHero}><View style={styles.reviewHeroIcon}><Icon name="people-outline" color={colors.greenDark} size={30} /></View><View style={{ flex: 1 }}><Text style={styles.reviewHeroTitle}>Make the next visit easier.</Text><Text style={styles.reviewHeroBody}>Share what helped: parking, lighting, sound, and how the food felt.</Text></View></View>
        <SectionTitle title="Your recent notes" action="Community" onAction={() => Alert.alert('Community reviews', 'Shared reviews will appear here once your account is connected.')} />
        {reviews.map((review) => <View key={review.id} style={styles.reviewCard}><View style={styles.reviewTop}><View style={styles.restaurantMark}><Icon name={review.type === 'Restaurant' ? 'restaurant-outline' : 'sparkles-outline'} color={colors.orange} size={19} /></View><View style={{ flex: 1 }}><Text style={styles.reviewName}>{review.name}</Text><Text style={styles.reviewType}>{review.type}</Text></View><View style={styles.stars}>{[1, 2, 3, 4, 5].map((star) => <Icon key={star} name={star <= review.rating ? 'star' : 'star-outline'} color={colors.orange} size={14} />)}</View></View><Text style={styles.reviewNote}>{review.note}</Text><View style={styles.tagRow}>{review.tags.map((tag) => <Pill key={tag} label={tag} tone={tag.includes('Loud') ? 'red' : 'green'} />)}</View></View>)}
      </ScrollView>
    );
  }

  function renderSettings() {
    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}><View><Text style={styles.eyebrow}>MAKE IT YOURS</Text><Text style={styles.screenTitle}>Settings</Text></View><View style={styles.settingsMark}><Icon name="options" color={colors.card} size={18} /></View></View>
        <View style={styles.settingCard}><View style={styles.settingHeading}><View style={[styles.settingIcon, { backgroundColor: colors.lavender }]}><Icon name="sparkles-outline" color="#7565B5" /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Sensory-friendly mode</Text><Text style={styles.settingBody}>Tune recommendations for your comfort.</Text></View><Switch value={sensoryMode} onValueChange={setSensoryMode} trackColor={{ false: '#D9DEE2', true: '#B8E0B2' }} thumbColor={sensoryMode ? colors.greenDark : '#FFFFFF'} /></View><Text style={styles.settingPrompt}>What helps a place feel right?</Text><View style={styles.wrapRow}>{['Parking', 'Low Lighting', 'Loud', 'Calm Atmosphere'].map((need) => <Pill key={need} label={need} selected={sensoryNeeds.includes(need)} tone={need === 'Loud' ? 'red' : 'green'} onPress={() => toggleSensoryNeed(need)} />)}</View></View>
        <View style={styles.settingCard}><View style={styles.settingHeading}><View style={[styles.settingIcon, { backgroundColor: '#FDE6E4' }]}><Icon name="warning-outline" color={colors.red} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Allergens & avoid list</Text><Text style={styles.settingBody}>{selectedAllergens.length} selected · used in every recommendation.</Text></View><Icon name="chevron-forward" color={colors.muted} /></View><Text style={styles.settingPrompt}>Select anything you avoid</Text><View style={styles.wrapRow}>{allergens.map((allergen) => <Pill key={allergen} label={allergen} selected={selectedAllergens.includes(allergen)} tone="red" onPress={() => toggleAllergen(allergen)} />)}</View></View>
        <View style={styles.settingCard}><View style={styles.settingHeading}><View style={[styles.settingIcon, { backgroundColor: '#FFF0D4' }]}><Icon name="person-outline" color={colors.orange} /></View><View style={{ flex: 1 }}><Text style={styles.settingTitle}>Preferences</Text><Text style={styles.settingBody}>Diet style, goals, and notification choices.</Text></View><Icon name="chevron-forward" color={colors.muted} /></View><View style={styles.preferenceLine}><Text style={styles.preferenceLabel}>Diet style</Text><Text style={styles.preferenceValue}>Balanced <Icon name="chevron-forward" size={14} color={colors.muted} /></Text></View><View style={styles.preferenceLine}><Text style={styles.preferenceLabel}>Notifications</Text><Text style={styles.preferenceValue}>Helpful only <Icon name="chevron-forward" size={14} color={colors.muted} /></Text></View></View>
        <Text style={styles.version}>FoodFriend v1.0 · Made for better decisions</Text>
      </ScrollView>
    );
  }

  const content = activeTab === 'Home' ? renderHome() : activeTab === 'Inventory' ? renderInventory() : activeTab === 'Discover' ? renderDiscover() : activeTab === 'Reviews' ? renderReviews() : renderSettings();

  return (
    <SafeAreaView style={styles.safeArea}><StatusBar style="dark" />{content}<View style={styles.tabBar}>{(Object.keys(iconForTab) as Tab[]).map((tab) => <Pressable key={tab} onPress={() => setActiveTab(tab)} style={styles.tabItem}><Icon name={iconForTab[tab]} size={22} color={activeTab === tab ? colors.greenDark : colors.muted} /><Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>{tab}</Text></Pressable>)}</View>
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Add to inventory</Text><Pressable onPress={() => setShowAdd(false)}><Icon name="close" color={colors.muted} /></Pressable></View><TextInput autoFocus placeholder="Food name" value={newItem.name} onChangeText={(name) => setNewItem((item) => ({ ...item, name }))} style={styles.modalInput} /><TextInput placeholder="Quantity" value={newItem.quantity} onChangeText={(quantity) => setNewItem((item) => ({ ...item, quantity }))} style={styles.modalInput} /><Text style={styles.modalLabel}>Where does it live?</Text><View style={styles.wrapRow}>{(['Pantry', 'Fridge', 'Freezer', 'Spices'] as Storage[]).map((category) => <Pill key={category} label={category} selected={newItem.category === category} onPress={() => setNewItem((item) => ({ ...item, category }))} />)}</View><Pressable style={styles.primaryButton} onPress={addItem}><Text style={styles.primaryButtonText}>Add item</Text></Pressable></View></View></Modal>
      <Modal visible={showScan} transparent animationType="slide" onRequestClose={() => setShowScan(false)}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalHeader}><Text style={styles.modalTitle}>Snapshot your food</Text><Pressable onPress={() => setShowScan(false)}><Icon name="close" color={colors.muted} /></Pressable></View><View style={styles.scanPreview}><Icon name="camera-outline" size={48} color={colors.orange} /><Text style={styles.scanPreviewTitle}>Camera + OCR ready</Text><Text style={styles.scanPreviewBody}>This first build uses a simulated scan so you can test the flow. Camera permissions and real item recognition plug in here next.</Text></View>{scanMessage ? <View style={styles.scanResult}><Icon name="checkmark-circle" color={colors.greenDark} size={21} /><Text style={styles.scanResultText}>{scanMessage}</Text></View> : null}<Pressable style={styles.primaryButton} onPress={runScan}><Icon name="scan-outline" size={18} color={colors.card} /><Text style={styles.primaryButtonText}>Scan a shelf photo</Text></Pressable></View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 100 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  greeting: { color: colors.ink, fontSize: 27, fontWeight: '800', marginTop: 5, letterSpacing: -0.7 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.card, fontWeight: '800', fontSize: 18 },
  hero: { backgroundColor: colors.ink, borderRadius: 24, padding: 22, minHeight: 225, flexDirection: 'row', overflow: 'hidden', marginBottom: 25 },
  heroCopy: { flex: 1, paddingRight: 10 },
  heroEyebrow: { color: '#BFE8B7', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  heroTitle: { color: colors.card, fontSize: 25, lineHeight: 30, fontWeight: '800', marginTop: 10 },
  heroBody: { color: '#B7C1C8', fontSize: 13, lineHeight: 19, marginTop: 10 },
  heroButton: { backgroundColor: colors.card, borderRadius: 18, alignSelf: 'flex-start', paddingVertical: 11, paddingHorizontal: 14, marginTop: 17, flexDirection: 'row', alignItems: 'center', gap: 7 },
  heroButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  heroBadge: { width: 94, height: 94, borderRadius: 47, backgroundColor: '#222C35', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', transform: [{ rotate: '9deg' }] },
  heroBadgeText: { color: colors.orange, fontWeight: '900', fontSize: 10, letterSpacing: 1, marginTop: 4 },
  sectionTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 3 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  link: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: colors.card, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: colors.line },
  statIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statNumber: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 25 },
  quickCard: { width: '48%', backgroundColor: colors.card, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.line },
  quickIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  quickTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  quickBody: { color: colors.muted, fontSize: 11, marginTop: 4 },
  recommendCard: { backgroundColor: colors.card, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginBottom: 14 },
  recommendArt: { width: 76, height: 92, backgroundColor: '#DFF0D8', borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  recommendEmoji: { fontSize: 42 },
  recommendCopy: { flex: 1 },
  recommendLabel: { color: colors.greenDark, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  recommendTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 5 },
  recommendBody: { color: colors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  pill: { borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  pillText: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  pillTextSelected: { color: colors.card },
  sensoryNotice: { padding: 13, backgroundColor: colors.lavender, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  sensoryText: { color: '#5B4C98', fontSize: 11, fontWeight: '700', flex: 1 },
  screenHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  screenTitle: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -0.9, marginTop: 4 },
  roundButton: { width: 43, height: 43, borderRadius: 15, backgroundColor: colors.greenDark, alignItems: 'center', justifyContent: 'center' },
  searchBox: { backgroundColor: colors.card, borderRadius: 15, height: 50, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.line, marginBottom: 12 },
  searchInput: { flex: 1, color: colors.ink, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 7, marginBottom: 15 },
  scanBanner: { backgroundColor: '#FFF6E6', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 24 },
  scanBannerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  scanBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  inventoryCard: { backgroundColor: colors.card, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line, marginBottom: 10, gap: 11 },
  foodIcon: { width: 49, height: 49, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  foodEmoji: { fontSize: 25 },
  inventoryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  inventoryName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  inventoryMeta: { color: colors.muted, fontSize: 10, marginTop: 3 },
  inventoryNutrition: { color: colors.muted, fontSize: 10, marginTop: 6 },
  avoidBadge: { backgroundColor: '#FDE6E4', paddingVertical: 3, paddingHorizontal: 6, borderRadius: 6 },
  avoidText: { color: colors.red, fontSize: 8, fontWeight: '900' },
  alternative: { color: colors.greenDark, fontSize: 10, marginTop: 7, fontWeight: '700' },
  score: { alignItems: 'center', minWidth: 34 },
  scoreNumber: { color: colors.greenDark, fontWeight: '900', fontSize: 16 },
  scoreLabel: { color: colors.muted, fontSize: 8, marginTop: 1 },
  intro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -8, marginBottom: 18 },
  matchBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFF0D4', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 10 },
  matchText: { color: '#9B6711', fontSize: 10, fontWeight: '900' },
  discoveryFeature: { backgroundColor: colors.greenDark, borderRadius: 24, padding: 21, marginBottom: 25 },
  featureEyebrow: { color: '#C4E9BD', fontSize: 10, letterSpacing: 1.2, fontWeight: '900' },
  featureTitle: { color: colors.card, fontSize: 24, lineHeight: 29, fontWeight: '900', marginTop: 9 },
  featureBody: { color: '#D9F0D5', fontSize: 13, lineHeight: 19, marginTop: 9 },
  featureFooter: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 17 },
  arrowCircle: { width: 35, height: 35, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  discoveryRow: { backgroundColor: colors.card, borderRadius: 19, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.line, marginBottom: 10 },
  discoveryEmoji: { width: 54, height: 54, borderRadius: 16, backgroundColor: '#FFF6E6', alignItems: 'center', justifyContent: 'center' },
  discoveryLabel: { color: colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  discoveryTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 4 },
  discoveryMeta: { color: colors.muted, fontSize: 10, marginTop: 4 },
  avoidCallout: { backgroundColor: '#EAF6E7', borderRadius: 17, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  avoidCalloutTitle: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
  avoidCalloutBody: { color: colors.greenDark, fontSize: 10, marginTop: 3 },
  reviewHero: { backgroundColor: '#EAF6E7', borderRadius: 20, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 25 },
  reviewHeroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  reviewHeroTitle: { color: colors.greenDark, fontSize: 14, fontWeight: '900' },
  reviewHeroBody: { color: colors.greenDark, fontSize: 11, lineHeight: 16, marginTop: 4 },
  reviewCard: { backgroundColor: colors.card, borderRadius: 19, padding: 15, borderWidth: 1, borderColor: colors.line, marginBottom: 11 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restaurantMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#FFF0D4', alignItems: 'center', justifyContent: 'center' },
  reviewName: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  reviewType: { color: colors.muted, fontSize: 10, marginTop: 3 },
  stars: { flexDirection: 'row', gap: 1 },
  reviewNote: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: 13 },
  settingCard: { backgroundColor: colors.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, marginBottom: 13 },
  settingHeading: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  settingIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  settingTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  settingBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  settingPrompt: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 18, marginBottom: 9 },
  wrapRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  preferenceLine: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 13, marginTop: 13, flexDirection: 'row', justifyContent: 'space-between' },
  preferenceLabel: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  preferenceValue: { color: colors.muted, fontSize: 12 },
  settingsMark: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#7565B5', alignItems: 'center', justifyContent: 'center' },
  version: { color: colors.muted, textAlign: 'center', fontSize: 10, marginTop: 8, marginBottom: 12 },
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 78, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingBottom: 8 },
  tabItem: { alignItems: 'center', justifyContent: 'center', width: 66, gap: 4 },
  tabLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  tabLabelActive: { color: colors.greenDark },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(18,25,35,0.45)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: colors.card, borderTopLeftRadius: 27, borderTopRightRadius: 27, padding: 21, paddingBottom: 34 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  modalTitle: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  modalInput: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 14, height: 49, marginBottom: 10, color: colors.ink, fontSize: 14 },
  modalLabel: { color: colors.ink, fontSize: 11, fontWeight: '800', marginTop: 5, marginBottom: 9 },
  primaryButton: { backgroundColor: colors.greenDark, borderRadius: 15, height: 50, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 22 },
  primaryButtonText: { color: colors.card, fontSize: 13, fontWeight: '900' },
  scanPreview: { backgroundColor: colors.ink, borderRadius: 20, minHeight: 195, alignItems: 'center', justifyContent: 'center', padding: 25 },
  scanPreviewTitle: { color: colors.card, fontSize: 17, fontWeight: '900', marginTop: 12 },
  scanPreviewBody: { color: '#B7C1C8', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  scanResult: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#EAF6E7', borderRadius: 14, padding: 12, marginTop: 13 },
  scanResultText: { color: colors.greenDark, fontSize: 12, fontWeight: '700', flex: 1 },
});

export default App;
