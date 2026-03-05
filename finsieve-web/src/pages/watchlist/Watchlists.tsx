import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Menu,
  MenuItem,
  Divider,
} from "@mui/material";
import {
  Add,
  Delete,
  Edit,
  MoreVert,
  StarBorder,
  Visibility,
  Bookmark,
  FolderOpen,
  Close,
  Refresh,
} from "@mui/icons-material";
import watchlistService, {
  type WatchlistData,
  type WatchlistItem,
} from "../../services/watchlist/watchlistService";
import toast from "react-hot-toast";

const ASSET_CLASS_COLORS: Record<string, string> = {
  US_EQUITY: "#3b82f6",
  CRYPTO: "#f59e0b",
  MUTUAL_FUND: "#10b981",
  COMMODITY: "#ef4444",
  BOND: "#6366f1",
  INDEX: "#8b5cf6",
};

const Watchlists = () => {
  const theme = useTheme();
  const [watchlists, setWatchlists] = useState<WatchlistData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWatchlist, setSelectedWatchlist] =
    useState<WatchlistData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Menu
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [menuWatchlistId, setMenuWatchlistId] = useState<string | null>(null);

  // Load all watchlists
  const loadWatchlists = useCallback(async () => {
    setLoading(true);
    try {
      const res = await watchlistService.getWatchlists() as { data?: WatchlistData[] };
      if (res?.data) setWatchlists(res.data);
    } catch {
      console.error("Error loading watchlists");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlists();
  }, [loadWatchlists]);

  // Load watchlist details
  const loadWatchlistDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await watchlistService.getWatchlistById(id) as { data?: WatchlistData };
      if (res?.data) setSelectedWatchlist(res.data);
    } catch {
      console.error("Error loading watchlist");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // Create watchlist
  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await watchlistService.createWatchlist({
        name: newName,
        description: newDescription,
      });
      toast.success("Watchlist created!");
      setCreateOpen(false);
      setNewName("");
      setNewDescription("");
      loadWatchlists();
    } catch {
      console.error("Create error");
      toast.error("Failed to create watchlist");
    }
  };

  // Update watchlist
  const handleUpdate = async () => {
    if (!selectedWatchlist) return;
    try {
      await watchlistService.updateWatchlist(selectedWatchlist.id, {
        name: newName,
        description: newDescription,
      });
      toast.success("Watchlist updated!");
      setEditOpen(false);
      loadWatchlists();
      loadWatchlistDetail(selectedWatchlist.id);
    } catch {
      toast.error("Update failed");
    }
  };

  const handleDelete = async () => {
    if (!menuWatchlistId) return;
    try {
      await watchlistService.deleteWatchlist(menuWatchlistId);
      toast.success("Watchlist deleted");
      setDeleteConfirmOpen(false);
      setMenuWatchlistId(null);
      if (selectedWatchlist?.id === menuWatchlistId) setSelectedWatchlist(null);
      loadWatchlists();
    } catch {
      toast.error("Delete failed");
    }
  };

  const removeItem = async (watchlistId: string, itemId: string) => {
    try {
      await watchlistService.removeItem(watchlistId, itemId);
      toast.success("Item removed");
      loadWatchlistDetail(watchlistId);
      loadWatchlists();
    } catch {
      toast.error("Failed to remove item");
    }
  };

  // Menu handlers
  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    watchlistId: string,
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMenuWatchlistId(watchlistId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuWatchlistId(null);
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 12,
        }}
      >
        <CircularProgress size={48} />
        <Typography sx={{ mt: 2, color: "text.secondary" }}>
          Loading watchlists...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 4,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
            <Bookmark sx={{ fontSize: 36, color: "primary.main" }} />
            <Typography variant="h4" fontWeight={800}>
              My Watchlists
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Track your favorite instruments across all asset classes — one place
            for everything
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
          sx={{ fontWeight: 700, borderRadius: 2, px: 3 }}
        >
          New Watchlist
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "350px 1fr" },
          gap: 3,
        }}
      >
        {/* Watchlist Sidebar */}
        <Box>
          {watchlists.length === 0 ? (
            <Card sx={{ borderRadius: 3, textAlign: "center", py: 6 }}>
              <FolderOpen
                sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
              />
              <Typography color="text.secondary" fontWeight={600}>
                No watchlists yet
              </Typography>
              <Typography fontSize={13} color="text.disabled" sx={{ mb: 2 }}>
                Create your first watchlist to start tracking
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => setCreateOpen(true)}
              >
                Create Watchlist
              </Button>
            </Card>
          ) : (
            watchlists.map((wl) => (
              <Card
                key={wl.id}
                onClick={() => loadWatchlistDetail(wl.id)}
                sx={{
                  mb: 1.5,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: `2px solid ${selectedWatchlist?.id === wl.id ? theme.palette.primary.main : "transparent"}`,
                  backgroundColor:
                    selectedWatchlist?.id === wl.id
                      ? alpha(theme.palette.primary.main, 0.06)
                      : theme.palette.background.paper,
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: alpha(theme.palette.primary.main, 0.4),
                    transform: "translateX(4px)",
                  },
                }}
              >
                <CardContent sx={{ py: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} fontSize={16} noWrap>
                        {wl.name}
                      </Typography>
                      {wl.description && (
                        <Typography fontSize={12} color="text.secondary" noWrap>
                          {wl.description}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mt: 0.5,
                        }}
                      >
                        <Chip
                          label={`${wl.item_count || 0} items`}
                          size="small"
                          sx={{ fontSize: 11, height: 22 }}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, wl.id)}
                    >
                      <MoreVert fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Box>

        {/* Watchlist Detail */}
        <Box>
          {detailLoading ? (
            <Card
              sx={{
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                py: 8,
              }}
            >
              <CircularProgress />
            </Card>
          ) : selectedWatchlist ? (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box>
                    <Typography variant="h5" fontWeight={800}>
                      {selectedWatchlist.name}
                    </Typography>
                    {selectedWatchlist.description && (
                      <Typography fontSize={13} color="text.secondary">
                        {selectedWatchlist.description}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setNewName(selectedWatchlist.name);
                          setNewDescription(
                            selectedWatchlist.description || "",
                          );
                          setEditOpen(true);
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Refresh">
                      <IconButton
                        size="small"
                        onClick={() =>
                          loadWatchlistDetail(selectedWatchlist.id)
                        }
                      >
                        <Refresh fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Items list */}
                {!selectedWatchlist.items ||
                selectedWatchlist.items.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <StarBorder
                      sx={{ fontSize: 56, color: "text.disabled", mb: 1 }}
                    />
                    <Typography color="text.secondary" fontWeight={600}>
                      Empty watchlist
                    </Typography>
                    <Typography fontSize={13} color="text.disabled">
                      Add instruments from any market page to track them here
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ overflowX: "auto" }}>
                    <Box
                      component="table"
                      sx={{
                        width: "100%",
                        borderCollapse: "collapse",
                        "& th, & td": {
                          py: 1.5,
                          px: 2,
                          borderBottom: `1px solid ${theme.palette.divider}`,
                          fontSize: 14,
                          whiteSpace: "nowrap",
                        },
                        "& th": {
                          fontWeight: 700,
                          color: "text.secondary",
                          textAlign: "left",
                        },
                        "& tr:hover td": {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.04,
                          ),
                        },
                      }}
                    >
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Symbol</th>
                          <th>Name</th>
                          <th>Asset Class</th>
                          <th>Notes</th>
                          <th>Added</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedWatchlist.items.map(
                          (item: WatchlistItem, idx: number) => (
                            <tr key={item.id}>
                              <td
                                style={{
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                {idx + 1}
                              </td>
                              <td style={{ fontWeight: 700 }}>{item.symbol}</td>
                              <td>{item.name || "—"}</td>
                              <td>
                                <Chip
                                  label={item.asset_class.replace("_", " ")}
                                  size="small"
                                  sx={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    height: 24,
                                    color:
                                      ASSET_CLASS_COLORS[item.asset_class] ||
                                      "#888",
                                    backgroundColor: alpha(
                                      ASSET_CLASS_COLORS[item.asset_class] ||
                                        "#888",
                                      0.1,
                                    ),
                                  }}
                                />
                              </td>
                              <td
                                style={{
                                  maxWidth: 200,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  color: theme.palette.text.secondary,
                                }}
                              >
                                {item.notes || "—"}
                              </td>
                              <td
                                style={{
                                  color: theme.palette.text.secondary,
                                  fontSize: 12,
                                }}
                              >
                                {item.added_at
                                  ? new Date(item.added_at).toLocaleDateString()
                                  : "—"}
                              </td>
                              <td>
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      removeItem(selectedWatchlist.id, item.id)
                                    }
                                  >
                                    <Close fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card sx={{ borderRadius: 3, textAlign: "center", py: 8 }}>
              <Visibility
                sx={{ fontSize: 64, color: "text.disabled", mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                Select a watchlist to view its instruments
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Or create a new one to start tracking your investments
              </Typography>
            </Card>
          )}
        </Box>
      </Box>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Watchlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Watchlist Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Watchlist</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdate}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Watchlist?</DialogTitle>
        <DialogContent>
          <Typography>
            This will permanently delete this watchlist and all its items.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const wl = watchlists.find((w) => w.id === menuWatchlistId);
            if (wl) {
              setNewName(wl.name);
              setNewDescription(wl.description || "");
              setSelectedWatchlist(wl);
              setEditOpen(true);
            }
            handleMenuClose();
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteConfirmOpen(true);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Watchlists;
