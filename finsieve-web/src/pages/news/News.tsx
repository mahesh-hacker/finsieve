import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Avatar,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
} from "@mui/material";
import {
  Search,
  OpenInNew,
  Bookmark,
  BookmarkBorder,
  TrendingUp,
  TrendingDown,
  Article,
  FilterList,
  Refresh,
  Circle,
} from "@mui/icons-material";
import toast from "react-hot-toast";

/* ─── Mock news data ───────────────────────────────────────────── */
const ALL_NEWS = [
  {
    id: 1,
    title: "Nifty 50 hits fresh all-time high; Sensex surges 700 points on FII buying",
    summary: "Indian benchmark indices surged on Monday as foreign institutional investors turned net buyers, pumping in over ₹3,500 crore into the markets. Banking and IT stocks led the rally.",
    source: "Economic Times",
    author: "Ravi Kumar",
    time: "15 minutes ago",
    category: "Markets",
    sentiment: "positive",
    relatedStocks: ["HDFCBANK", "TCS", "RELIANCE"],
    readTime: "3 min read",
    featured: true,
  },
  {
    id: 2,
    title: "RBI keeps repo rate unchanged at 6.5%; hints at rate cut in H2 FY26",
    summary: "The Monetary Policy Committee unanimously decided to keep the repo rate steady, while shifting to an accommodative stance that signals potential rate cuts in the second half of the fiscal year.",
    source: "Business Standard",
    author: "Meera Sharma",
    time: "1 hour ago",
    category: "Economy",
    sentiment: "neutral",
    relatedStocks: ["HDFCBANK", "ICICIBANK", "KOTAKBANK"],
    readTime: "4 min read",
    featured: true,
  },
  {
    id: 3,
    title: "TCS Q3 FY26 results: Net profit jumps 12%, beats analyst estimates",
    summary: "India's largest IT company reported a 12.3% year-on-year increase in net profit for Q3 FY26, driven by strong deal wins in the BFSI segment and improving margins.",
    source: "Moneycontrol",
    author: "Priya Singh",
    time: "2 hours ago",
    category: "Earnings",
    sentiment: "positive",
    relatedStocks: ["TCS"],
    readTime: "5 min read",
    featured: false,
  },
  {
    id: 4,
    title: "Bitcoin crosses $70,000 for first time in 2026; crypto market cap nears $3T",
    summary: "The world's largest cryptocurrency broke through the $70,000 mark as institutional demand continued to surge, with spot ETF inflows reaching a record $800 million in a single day.",
    source: "CoinDesk",
    author: "Alex Johnson",
    time: "3 hours ago",
    category: "Crypto",
    sentiment: "positive",
    relatedStocks: ["BTC", "ETH"],
    readTime: "3 min read",
    featured: false,
  },
  {
    id: 5,
    title: "Oil prices slip on demand concerns; Brent crude falls to $78/barrel",
    summary: "Crude oil prices declined amid weaker-than-expected economic data from China and increased OPEC+ output. Indian refiners including BPCL and HPCL may benefit from lower input costs.",
    source: "Reuters",
    author: "Sarah Williams",
    time: "4 hours ago",
    category: "Commodities",
    sentiment: "negative",
    relatedStocks: ["BPCL", "HPCL", "ONGC"],
    readTime: "2 min read",
    featured: false,
  },
  {
    id: 6,
    title: "Sebi proposes new framework for mutual fund fee structures",
    summary: "The markets regulator has released a consultation paper proposing changes to expense ratio structures for mutual funds, aimed at improving transparency and reducing costs for retail investors.",
    source: "Mint",
    author: "Anjali Desai",
    time: "5 hours ago",
    category: "Regulatory",
    sentiment: "neutral",
    relatedStocks: [],
    readTime: "6 min read",
    featured: false,
  },
  {
    id: 7,
    title: "Reliance Industries to invest ₹75,000 crore in green energy by 2026",
    summary: "Mukesh Ambani-led Reliance Industries announced a massive green energy investment plan at its AGM, targeting 100 GW of renewable energy capacity and positioning the conglomerate as a global clean energy leader.",
    source: "Bloomberg",
    author: "Rahul Mishra",
    time: "6 hours ago",
    category: "Corporate",
    sentiment: "positive",
    relatedStocks: ["RELIANCE"],
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 8,
    title: "US Fed signals two rate cuts in 2026; dollar weakens globally",
    summary: "Federal Reserve officials indicated a willingness to cut interest rates twice this year if inflation data cooperates, sending the dollar lower and emerging market currencies including the rupee higher.",
    source: "Financial Times",
    author: "Mark Thompson",
    time: "8 hours ago",
    category: "Global",
    sentiment: "positive",
    relatedStocks: ["USDINR"],
    readTime: "4 min read",
    featured: false,
  },
  {
    id: 9,
    title: "Mid-cap funds outperform large-caps in February 2026; SIP inflows hit record",
    summary: "Mid and small-cap mutual funds delivered superior returns in February, buoyed by strong corporate earnings and domestic institutional buying. SIP inflows crossed ₹25,000 crore for the first time.",
    source: "Value Research",
    author: "Kavita Nair",
    time: "1 day ago",
    category: "Mutual Funds",
    sentiment: "positive",
    relatedStocks: [],
    readTime: "5 min read",
    featured: false,
  },
  {
    id: 10,
    title: "Adani Group stocks rally 5-8% after Q3 results; debt reduction on track",
    summary: "Adani Group's flagship companies surged after the conglomerate reported strong operational performance across its infrastructure, energy, and ports businesses, with overall net debt declining by ₹8,000 crore.",
    source: "NDTV Profit",
    author: "Vikash Gupta",
    time: "1 day ago",
    category: "Earnings",
    sentiment: "positive",
    relatedStocks: ["ADANIENT", "ADANIPORTS"],
    readTime: "3 min read",
    featured: false,
  },
  {
    id: 11,
    title: "Gold hits ₹70,000/10g for first time; central bank buying cited",
    summary: "Gold prices in India crossed the ₹70,000 per 10 grams mark for the first time in history, driven by global uncertainty and strong central bank purchases by multiple emerging market nations.",
    source: "Zee Business",
    author: "Suresh Patel",
    time: "1 day ago",
    category: "Commodities",
    sentiment: "positive",
    relatedStocks: ["GOLDBEES", "GOLD"],
    readTime: "3 min read",
    featured: false,
  },
  {
    id: 12,
    title: "IT sector faces headwinds as US clients cut discretionary spending",
    summary: "India's IT industry faces near-term challenges as North American clients reduce discretionary technology spending amid economic uncertainty. Smaller deal sizes and project deferrals are impacting revenue visibility.",
    source: "Hindu Business Line",
    author: "Nandita Rao",
    time: "2 days ago",
    category: "Sector",
    sentiment: "negative",
    relatedStocks: ["TCS", "INFY", "WIPRO"],
    readTime: "4 min read",
    featured: false,
  },
];

const CATEGORIES = ["All", "Markets", "Economy", "Earnings", "Crypto", "Commodities", "Regulatory", "Corporate", "Global", "Mutual Funds", "Sector"];

const sentimentConfig: Record<string, { color: string; icon: React.ReactNode }> = {
  positive: { color: "#10b981", icon: <TrendingUp sx={{ fontSize: 12 }} /> },
  negative: { color: "#ef4444", icon: <TrendingDown sx={{ fontSize: 12 }} /> },
  neutral: { color: "#f59e0b", icon: <Circle sx={{ fontSize: 8 }} /> },
};

const sourceAvatars: Record<string, string> = {
  "Economic Times": "ET",
  "Business Standard": "BS",
  Moneycontrol: "MC",
  "Mint": "MI",
  Reuters: "RE",
  Bloomberg: "BL",
  "Financial Times": "FT",
  CoinDesk: "CD",
  "Value Research": "VR",
  "NDTV Profit": "NP",
  "Zee Business": "ZB",
  "Hindu Business Line": "HB",
};

const sourceColors: Record<string, string> = {
  "Economic Times": "#e44d26",
  "Business Standard": "#2563eb",
  Moneycontrol: "#7c3aed",
  Mint: "#059669",
  Reuters: "#dc2626",
  Bloomberg: "#1d4ed8",
  "Financial Times": "#f97316",
  CoinDesk: "#6366f1",
  "Value Research": "#0891b2",
  "NDTV Profit": "#dc2626",
  "Zee Business": "#7c3aed",
  "Hindu Business Line": "#374151",
};

/* ─── News Card (Featured) ─────────────────────────────────────── */
const FeaturedCard = ({ article }: { article: typeof ALL_NEWS[0] }) => {
  const theme = useTheme();
  const [saved, setSaved] = useState(false);
  const sc = sentimentConfig[article.sentiment];

  return (
    <Card
      sx={{
        borderRadius: 3,
        overflow: "hidden",
        height: "100%",
        border: `1px solid ${theme.palette.divider}`,
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: `0 12px 40px ${alpha(theme.palette.primary.main, 0.08)}`,
          borderColor: alpha(theme.palette.primary.main, 0.2),
        },
      }}
    >
      {/* Category gradient bar */}
      <Box
        sx={{
          height: 3,
          background: `linear-gradient(90deg, ${sc.color}, ${alpha(sc.color, 0.3)})`,
        }}
      />
      <CardContent sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={article.category}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 700,
                background: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
              }}
            />
            <Chip
              icon={sc.icon as React.ReactElement}
              label={article.sentiment}
              size="small"
              sx={{
                fontSize: 11,
                fontWeight: 600,
                background: alpha(sc.color, 0.1),
                color: sc.color,
                "& .MuiChip-icon": { color: `${sc.color} !important` },
              }}
            />
          </Box>
          <Tooltip title={saved ? "Remove from saved" : "Save article"}>
            <IconButton
              size="small"
              onClick={() => {
                setSaved(!saved);
                toast.success(saved ? "Article removed" : "Article saved");
              }}
            >
              {saved ? <Bookmark sx={{ fontSize: 18, color: "#6366f1" }} /> : <BookmarkBorder sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        <Typography
          variant="h6"
          fontWeight={800}
          mb={1.5}
          sx={{
            fontSize: 17,
            lineHeight: 1.4,
            cursor: "pointer",
            "&:hover": { color: "primary.main" },
            transition: "color 0.15s",
          }}
        >
          {article.title}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          mb={2.5}
          sx={{ lineHeight: 1.7, fontSize: 14 }}
        >
          {article.summary}
        </Typography>

        {/* Related stocks */}
        {article.relatedStocks.length > 0 && (
          <Box display="flex" gap={0.75} mb={2.5} flexWrap="wrap">
            {article.relatedStocks.map((s) => (
              <Chip
                key={s}
                label={s}
                size="small"
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                  border: `1px solid ${theme.palette.divider}`,
                  fontFamily: "monospace",
                }}
              />
            ))}
          </Box>
        )}

        <Divider sx={{ mb: 2 }} />

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar
              sx={{
                width: 28,
                height: 28,
                fontSize: 10,
                fontWeight: 800,
                background: sourceColors[article.source] || "#6366f1",
              }}
            >
              {sourceAvatars[article.source] || article.source.slice(0, 2)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{article.source}</Typography>
              <Typography sx={{ fontSize: 11, color: "text.disabled" }}>{article.time} · {article.readTime}</Typography>
            </Box>
          </Box>
          <Button
            size="small"
            endIcon={<OpenInNew sx={{ fontSize: 12 }} />}
            sx={{ fontSize: 12, fontWeight: 600, color: "primary.main" }}
          >
            Read
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

/* ─── News Row (List) ──────────────────────────────────────────── */
const NewsRow = ({ article, last }: { article: typeof ALL_NEWS[0]; last: boolean }) => {
  const theme = useTheme();
  const [saved, setSaved] = useState(false);
  const sc = sentimentConfig[article.sentiment];

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          py: 2,
          alignItems: "flex-start",
          transition: "background 0.15s",
          borderRadius: 1.5,
          px: 1,
          mx: -1,
          "&:hover": { background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" },
        }}
      >
        {/* Source icon */}
        <Avatar
          sx={{
            width: 36,
            height: 36,
            fontSize: 11,
            fontWeight: 800,
            background: sourceColors[article.source] || "#6366f1",
            flexShrink: 0,
            mt: 0.25,
          }}
        >
          {sourceAvatars[article.source] || article.source.slice(0, 2)}
        </Avatar>

        <Box flex={1} minWidth={0}>
          <Box display="flex" gap={0.75} mb={0.75} flexWrap="wrap">
            <Chip
              label={article.category}
              size="small"
              sx={{ height: 18, fontSize: 10, fontWeight: 700, background: alpha(theme.palette.primary.main, 0.08), color: theme.palette.primary.main }}
            />
            <Box display="flex" alignItems="center" gap={0.4}>
              <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: sc.color, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 10, fontWeight: 600, color: sc.color, textTransform: "capitalize" }}>{article.sentiment}</Typography>
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1.45,
              cursor: "pointer",
              mb: 0.75,
              "&:hover": { color: "primary.main" },
            }}
          >
            {article.title}
          </Typography>

          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Typography sx={{ fontSize: 12, color: "text.secondary", fontWeight: 600 }}>{article.source}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>{article.time}</Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>·</Typography>
            <Typography sx={{ fontSize: 12, color: "text.disabled" }}>{article.readTime}</Typography>
            {article.relatedStocks.slice(0, 2).map((s) => (
              <Chip key={s} label={s} size="small" sx={{ height: 16, fontSize: 10, fontWeight: 700, fontFamily: "monospace", background: "transparent", border: `1px solid ${theme.palette.divider}` }} />
            ))}
          </Box>
        </Box>

        <Tooltip title={saved ? "Remove" : "Save"}>
          <IconButton size="small" onClick={() => setSaved(!saved)} sx={{ flexShrink: 0 }}>
            {saved ? <Bookmark sx={{ fontSize: 16, color: "#6366f1" }} /> : <BookmarkBorder sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
      </Box>
      {!last && <Divider />}
    </>
  );
};

/* ─── Main News Page ───────────────────────────────────────────── */
const News = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [sentimentFilter, setSentimentFilter] = useState("All");
  const [activeTab, setActiveTab] = useState(0);

  const filtered = useMemo(() => {
    return ALL_NEWS.filter((n) => {
      const matchesSearch =
        !searchQuery ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.relatedStocks.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === "All" || n.category === activeCategory;
      const matchesSentiment = sentimentFilter === "All" || n.sentiment === sentimentFilter;
      return matchesSearch && matchesCategory && matchesSentiment;
    });
  }, [searchQuery, activeCategory, sentimentFilter]);

  const featured = filtered.filter((n) => n.featured);
  const regular = filtered.filter((n) => !n.featured);

  const categoryCount = (cat: string) => cat === "All" ? ALL_NEWS.length : ALL_NEWS.filter((n) => n.category === cat).length;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Box display="flex" alignItems="center" gap={1.5} mb={1}>
            <Box className="live-dot" />
            <Chip label="LIVE" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, color: "#10b981", background: alpha("#10b981", 0.1), letterSpacing: 1 }} />
          </Box>
          <Typography variant="h4" fontWeight={800} letterSpacing={-0.5} mb={0.5}>
            Market News
          </Typography>
          <Typography color="text.secondary">
            Curated financial news from top sources, updated in real-time
          </Typography>
        </Box>
        <Button startIcon={<Refresh />} variant="outlined" onClick={() => toast.success("News refreshed")} sx={{ borderRadius: 2 }}>
          Refresh
        </Button>
      </Box>

      {/* Search + Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          placeholder="Search news, stocks, topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ flex: 1, minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <Select
            value={sentimentFilter}
            onChange={(e) => setSentimentFilter(e.target.value)}
            displayEmpty
            startAdornment={<FilterList fontSize="small" sx={{ mr: 0.5 }} />}
          >
            <MenuItem value="All">All Sentiment</MenuItem>
            <MenuItem value="positive">Positive</MenuItem>
            <MenuItem value="neutral">Neutral</MenuItem>
            <MenuItem value="negative">Negative</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Category Tabs */}
      <Box
        sx={{
          overflowX: "auto",
          mb: 3,
          "&::-webkit-scrollbar": { height: 0 },
        }}
      >
        <Box display="flex" gap={1} pb={0.5}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={`${cat} ${categoryCount(cat) < ALL_NEWS.length ? `(${categoryCount(cat)})` : ""}`}
              clickable
              onClick={() => setActiveCategory(cat)}
              sx={{
                fontWeight: 600,
                fontSize: 13,
                flexShrink: 0,
                ...(activeCategory === cat
                  ? {
                      background: alpha(theme.palette.primary.main, 0.12),
                      color: theme.palette.primary.main,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                    }
                  : {
                      background: "transparent",
                      border: `1px solid ${theme.palette.divider}`,
                    }),
              }}
            />
          ))}
        </Box>
      </Box>

      {filtered.length === 0 ? (
        <Card sx={{ borderRadius: 3, textAlign: "center", py: 8 }}>
          <Article sx={{ fontSize: 56, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No articles found</Typography>
          <Typography variant="body2" color="text.disabled" mt={1}>Try adjusting your search or filters</Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Main news column */}
          <Grid size={{ xs: 12, lg: 8 }}>
            {/* View toggle */}
            <Box mb={2}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                <Tab label="Latest" sx={{ fontWeight: 600, fontSize: 14 }} />
                <Tab label="Featured" sx={{ fontWeight: 600, fontSize: 14 }} />
              </Tabs>
            </Box>

            {activeTab === 0 ? (
              /* Latest view: list */
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  {filtered.map((article, i) => (
                    <NewsRow key={article.id} article={article} last={i === filtered.length - 1} />
                  ))}
                </CardContent>
              </Card>
            ) : (
              /* Featured view: grid */
              <Box>
                {featured.length > 0 && (
                  <>
                    <Typography fontWeight={700} fontSize={15} mb={2}>Featured Stories</Typography>
                    <Grid container spacing={2} mb={3}>
                      {featured.map((a) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={a.id}>
                          <FeaturedCard article={a} />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
                {regular.length > 0 && (
                  <>
                    <Typography fontWeight={700} fontSize={15} mb={2}>More News</Typography>
                    <Grid container spacing={2}>
                      {regular.map((a) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={a.id}>
                          <FeaturedCard article={a} />
                        </Grid>
                      ))}
                    </Grid>
                  </>
                )}
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Trending topics */}
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <Typography fontWeight={700} fontSize={15} mb={2}>Trending Topics</Typography>
                {[
                  { label: "RBI Policy", count: 24, up: true },
                  { label: "Q3 Earnings", count: 47, up: true },
                  { label: "FII Inflows", count: 18, up: true },
                  { label: "IT Sector", count: 31, up: false },
                  { label: "Gold Prices", count: 15, up: true },
                  { label: "Crypto Bull Run", count: 22, up: true },
                ].map((t, i) => (
                  <Box key={t.label}>
                    {i > 0 && <Divider />}
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      py={1.2}
                      sx={{ cursor: "pointer", "&:hover": { "& .topic-label": { color: "primary.main" } } }}
                    >
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Typography sx={{ fontSize: 12, color: "text.disabled", fontWeight: 700, minWidth: 20 }}>#{i + 1}</Typography>
                        <Typography className="topic-label" sx={{ fontSize: 14, fontWeight: 600, transition: "color 0.15s" }}>
                          {t.label}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography sx={{ fontSize: 12, color: "text.disabled" }}>{t.count} articles</Typography>
                        {t.up ? (
                          <TrendingUp sx={{ fontSize: 14, color: "#10b981" }} />
                        ) : (
                          <TrendingDown sx={{ fontSize: 14, color: "#ef4444" }} />
                        )}
                      </Box>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Market Sentiment */}
            <Card sx={{ borderRadius: 3, mb: 2 }}>
              <CardContent>
                <Typography fontWeight={700} fontSize={15} mb={2}>News Sentiment Today</Typography>
                {[
                  { label: "Positive", count: ALL_NEWS.filter((n) => n.sentiment === "positive").length, color: "#10b981" },
                  { label: "Neutral", count: ALL_NEWS.filter((n) => n.sentiment === "neutral").length, color: "#f59e0b" },
                  { label: "Negative", count: ALL_NEWS.filter((n) => n.sentiment === "negative").length, color: "#ef4444" },
                ].map((s) => {
                  const pct = Math.round((s.count / ALL_NEWS.length) * 100);
                  return (
                    <Box key={s.label} mb={1.5}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, color: s.color }}>{s.label}</Typography>
                        <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary" }}>{pct}% ({s.count})</Typography>
                      </Box>
                      <Box sx={{ height: 6, background: theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)", borderRadius: 3, overflow: "hidden" }}>
                        <Box sx={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: 3, transition: "width 0.8s ease" }} />
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>

            {/* Top Sources */}
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography fontWeight={700} fontSize={15} mb={2}>News Sources</Typography>
                {[...new Set(ALL_NEWS.map((n) => n.source))].map((source, i) => {
                  const count = ALL_NEWS.filter((n) => n.source === source).length;
                  return (
                    <Box key={source}>
                      {i > 0 && <Divider />}
                      <Box display="flex" alignItems="center" gap={1.5} py={1}>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            fontSize: 10,
                            fontWeight: 800,
                            background: sourceColors[source] || "#6366f1",
                          }}
                        >
                          {sourceAvatars[source] || source.slice(0, 2)}
                        </Avatar>
                        <Typography sx={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{source}</Typography>
                        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{count} articles</Typography>
                      </Box>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default News;
