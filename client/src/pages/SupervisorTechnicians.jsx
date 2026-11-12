
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import SupervisorSidebar from "../components/SupervisorSidebar";
import LogoutModal from "../components/LogoutModal";
import { useTheme } from "../context/ThemeContext";

function SupervisorTechnicians() {
    const { darkMode } = useTheme();

    const [technicians, setTechnicians] = useState([]);
    const [showLogout, setShowLogout] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [specializationFilter, setSpecializationFilter] =
        useState("All");

    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const user = JSON.parse(
        localStorage.getItem("user") || "{}"
    );

    const assignedBlocks = user?.assignedBlocks || [];

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        specialization: "General",
        block: assignedBlocks[0] || "",
    });

    // =====================================================
    // THEME CLASSES
    // =====================================================

    const surface = darkMode
        ? "border-slate-700 bg-slate-800"
        : "border-slate-200 bg-white";

    const headingText = darkMode
        ? "text-slate-100"
        : "text-slate-900";

    const bodyText = darkMode
        ? "text-slate-300"
        : "text-slate-700";

    const secondaryText = darkMode
        ? "text-slate-400"
        : "text-slate-500";

    const inputClass = darkMode
        ? "border-slate-600 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
        : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50";

    // =====================================================
    // FETCH TECHNICIANS
    // =====================================================

    const fetchTechnicians = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setFetchLoading(true);
            }

            setErrorMessage("");

            const token = localStorage.getItem("token");

            const response = await api.get(
                "/technicians",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setTechnicians(
                response.data.technicians || []
            );
        } catch (error) {
            console.log(
                "Failed to fetch technicians:",
                error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Failed to fetch technicians."
            );
        } finally {
            setFetchLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTechnicians();
    }, []);

    // =====================================================
    // HANDLE INPUT
    // =====================================================

    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // =====================================================
    // RESET FORM
    // =====================================================

    const resetForm = () => {
        setFormData({
            name: "",
            email: "",
            password: "",
            specialization: "General",
            block: assignedBlocks[0] || "",
        });

        setShowPassword(false);
    };

    // =====================================================
    // OPEN ADD MODAL
    // =====================================================

    const openAddModal = () => {
        resetForm();
        setMessage("");
        setErrorMessage("");
        setShowAddModal(true);
    };

    // =====================================================
    // CLOSE MODAL
    // =====================================================

    const closeModal = () => {
        if (loading) return;

        setShowAddModal(false);
        resetForm();

        setMessage("");
        setErrorMessage("");
    };

    // =====================================================
    // ADD TECHNICIAN
    // =====================================================

    const handleAddTechnician = async (e) => {
        e.preventDefault();

        setMessage("");
        setErrorMessage("");

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.password ||
            !formData.specialization ||
            !formData.block
        ) {
            setErrorMessage(
                "Please fill in all fields."
            );
            return;
        }

        if (formData.password.length < 6) {
            setErrorMessage(
                "Password must be at least 6 characters."
            );
            return;
        }

        try {
            setLoading(true);

            const token = localStorage.getItem("token");

            const response = await api.post(
                "/technicians",
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessage(
                response.data.message ||
                "Technician added successfully."
            );

            await fetchTechnicians(true);

            setTimeout(() => {
                setShowAddModal(false);
                resetForm();
                setMessage("");
            }, 1200);

        } catch (error) {
            console.log(
                "Add technician error:",
                error.response?.data || error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Failed to add technician."
            );
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // DELETE TECHNICIAN
    // =====================================================

    const handleDeleteTechnician = async (
        technicianId
    ) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this technician?"
        );

        if (!confirmDelete) return;

        try {
            setDeletingId(technicianId);
            setErrorMessage("");
            setMessage("");

            const token = localStorage.getItem("token");

            await api.delete(
                `/technicians/${technicianId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setMessage(
                "Technician deleted successfully."
            );

            await fetchTechnicians(true);

        } catch (error) {
            console.log(
                "Delete technician error:",
                error.response?.data || error
            );

            setErrorMessage(
                error.response?.data?.message ||
                "Failed to delete technician."
            );
        } finally {
            setDeletingId(null);
        }
    };

    // =====================================================
    // SPECIALIZATION LIST
    // =====================================================

    const specializations = useMemo(() => {
        return [
            ...new Set(
                technicians
                    .map((technician) =>
                        technician.specialization || "General"
                    )
            ),
        ].sort();
    }, [technicians]);

    // =====================================================
    // FILTER TECHNICIANS
    // =====================================================

    const filteredTechnicians = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        return technicians.filter((technician) => {
            const matchesSearch =
                !search ||
                technician.name?.toLowerCase().includes(search) ||
                technician.email?.toLowerCase().includes(search) ||
                technician.specialization?.toLowerCase().includes(search) ||
                technician.assignedBlocks?.some((block) =>
                    block.toLowerCase().includes(search)
                );

            const matchesSpecialization =
                specializationFilter === "All" ||
                (technician.specialization || "General") ===
                    specializationFilter;

            return matchesSearch && matchesSpecialization;
        });
    }, [
        technicians,
        searchTerm,
        specializationFilter,
    ]);

    // =====================================================
    // SPECIALIZATION COLORS
    // =====================================================

    const getSpecializationColor = (specialization) => {
        const colors = {
            Electrician: darkMode
                ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                : "bg-amber-50 text-amber-700 border-amber-200",

            "Computer Technician": darkMode
                ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                : "bg-blue-50 text-blue-700 border-blue-200",

            "AC Technician": darkMode
                ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                : "bg-cyan-50 text-cyan-700 border-cyan-200",

            Carpenter: darkMode
                ? "bg-orange-500/10 text-orange-300 border-orange-500/20"
                : "bg-orange-50 text-orange-700 border-orange-200",

            Plumber: darkMode
                ? "bg-violet-500/10 text-violet-300 border-violet-500/20"
                : "bg-violet-50 text-violet-700 border-violet-200",

            General: darkMode
                ? "bg-slate-700 text-slate-300 border-slate-600"
                : "bg-slate-100 text-slate-700 border-slate-200",
        };

        return colors[specialization] || (
            darkMode
                ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20"
                : "bg-indigo-50 text-indigo-700 border-indigo-200"
        );
    };

    // =====================================================
    // SPECIALIZATION ICON
    // =====================================================

    const getSpecializationIcon = (specialization) => {
        const icons = {
            Electrician: "⚡",
            "Computer Technician": "💻",
            "AC Technician": "❄️",
            Carpenter: "🪚",
            Plumber: "🔧",
            General: "🛠️",
        };

        return icons[specialization] || "👨‍🔧";
    };

    // =====================================================
    // STATISTICS
    // =====================================================

    const totalTechnicians = technicians.length;

    const totalSpecializations = specializations.length;

    const totalAssignedBlocks = new Set(
        technicians.flatMap(
            (technician) => technician.assignedBlocks || []
        )
    ).size;

    // =====================================================
    // STAT CARD
    // =====================================================

    const StatCard = ({
        title,
        value,
        icon,
        iconBg,
        valueColor,
        description,
    }) => (
        <div
            className={`group rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${surface}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider ${secondaryText}`}>
                        {title}
                    </p>

                    <h2 className={`mt-3 text-3xl font-black ${valueColor || headingText}`}>
                        {value}
                    </h2>

                    <p className={`mt-1 text-xs ${secondaryText}`}>
                        {description}
                    </p>
                </div>

                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${iconBg}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    // =====================================================
    // RENDER
    // =====================================================

    return (
        <div
            className={`min-h-screen transition-colors duration-300 ${
                darkMode
                    ? "bg-slate-950 text-slate-100"
                    : "bg-slate-50 text-slate-900"
            }`}
        >
            {/* SIDEBAR */}

            <SupervisorSidebar
                onLogout={() => setShowLogout(true)}
            />

            <div className="lg:ml-64">

                {/* =================================================
                    HEADER
                ================================================= */}

                <header
                    className={`border-b px-5 py-6 sm:px-7 ${
                        darkMode
                            ? "border-slate-800 bg-slate-900"
                            : "border-slate-200 bg-white"
                    }`}
                >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-indigo-500" />

                                <p className="text-xs font-black uppercase tracking-widest text-indigo-500">
                                    CampusFix Supervisor Portal
                                </p>
                            </div>

                            <h1 className={`mt-2 text-2xl font-black tracking-tight sm:text-3xl ${headingText}`}>
                                Technician Management
                            </h1>

                            <p className={`mt-2 text-sm ${secondaryText}`}>
                                Manage, monitor and organize your maintenance team.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                type="button"
                                disabled={refreshing}
                                onClick={() => fetchTechnicians(true)}
                                className={`rounded-xl border px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                                    darkMode
                                        ? "border-slate-700 bg-slate-800 text-slate-200 hover:border-indigo-500"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
                                }`}
                            >
                                {refreshing
                                    ? "↻ Refreshing..."
                                    : "↻ Refresh"}
                            </button>

                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
                            >
                                <span className="text-xl">+</span>
                                Add Technician
                            </button>
                        </div>
                    </div>
                </header>

                <main className="p-4 sm:p-6 lg:p-7">

                    {/* =================================================
                        NOTIFICATIONS
                    ================================================= */}

                    {message && (
                        <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
                            darkMode
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
                                ✓
                            </span>

                            <span>{message}</span>

                            <button
                                type="button"
                                onClick={() => setMessage("")}
                                className="ml-auto"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <div className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 text-sm font-semibold ${
                            darkMode
                                ? "border-red-500/30 bg-red-500/10 text-red-300"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/15">
                                !
                            </span>

                            <span>{errorMessage}</span>

                            <button
                                type="button"
                                onClick={() => setErrorMessage("")}
                                className="ml-auto"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {/* =================================================
                        BLOCK ACCESS
                    ================================================= */}

                    <section
                        className={`mb-6 overflow-hidden rounded-2xl border p-5 ${
                            darkMode
                                ? "border-indigo-500/20 bg-indigo-500/10"
                                : "border-indigo-100 bg-indigo-50"
                        }`}
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                                    darkMode
                                        ? "bg-indigo-500/15"
                                        : "bg-white"
                                }`}>
                                    🏢
                                </div>

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                        Your Assigned Blocks
                                    </p>

                                    <p className={`mt-1 text-base font-black ${
                                        darkMode
                                            ? "text-indigo-200"
                                            : "text-indigo-950"
                                    }`}>
                                        {assignedBlocks.length
                                            ? assignedBlocks.join(", ")
                                            : "No block assigned"}
                                    </p>
                                </div>
                            </div>

                            <div className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-black ${
                                darkMode
                                    ? "border-indigo-500/20 bg-slate-900 text-indigo-300"
                                    : "border-indigo-100 bg-white text-indigo-700"
                            }`}>
                                🔐 Block Restricted
                            </div>
                        </div>
                    </section>

                    {/* =================================================
                        STATISTICS
                    ================================================= */}

                    <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Total Technicians"
                            value={totalTechnicians}
                            icon="👨‍🔧"
                            iconBg={darkMode ? "bg-indigo-500/15" : "bg-indigo-50"}
                            description="Registered technicians"
                        />

                        <StatCard
                            title="Specializations"
                            value={totalSpecializations}
                            icon="🛠️"
                            iconBg={darkMode ? "bg-violet-500/15" : "bg-violet-50"}
                            description="Available skill categories"
                            valueColor="text-violet-500"
                        />

                        <StatCard
                            title="Assigned Blocks"
                            value={totalAssignedBlocks}
                            icon="🏢"
                            iconBg={darkMode ? "bg-amber-500/15" : "bg-amber-50"}
                            description="Blocks covered by technicians"
                            valueColor="text-amber-500"
                        />

                        <StatCard
                            title="Team Availability"
                            value={totalTechnicians > 0 ? "Active" : "—"}
                            icon="✓"
                            iconBg={darkMode ? "bg-emerald-500/15" : "bg-emerald-50"}
                            description="Technician team overview"
                            valueColor="text-emerald-500"
                        />
                    </section>

                    {/* =================================================
                        SEARCH AND FILTERS
                    ================================================= */}

                    <section className={`mb-6 rounded-2xl border p-5 shadow-sm ${surface}`}>
                        <div className="mb-4">
                            <h2 className={`text-base font-black ${headingText}`}>
                                Find Your Technicians
                            </h2>

                            <p className={`mt-1 text-xs ${secondaryText}`}>
                                Search by name, email, specialization or block.
                            </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-[1fr_240px_auto]">
                            <div className="relative">
                                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    🔎
                                </span>

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Search technicians..."
                                    className={`w-full rounded-xl border py-3 pl-11 pr-4 text-sm outline-none transition ${inputClass}`}
                                />
                            </div>

                            <select
                                value={specializationFilter}
                                onChange={(e) =>
                                    setSpecializationFilter(e.target.value)
                                }
                                className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${inputClass}`}
                            >
                                <option value="All">
                                    All Specializations
                                </option>

                                {specializations.map((specialization) => (
                                    <option
                                        key={specialization}
                                        value={specialization}
                                    >
                                        {specialization}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setSpecializationFilter("All");
                                }}
                                className={`rounded-xl border px-5 py-3 text-sm font-bold transition ${
                                    darkMode
                                        ? "border-slate-600 bg-slate-700 text-slate-200 hover:bg-slate-600"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                                }`}
                            >
                                Reset
                            </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                            <p className={`text-xs font-semibold ${secondaryText}`}>
                                Showing{" "}
                                <span className={headingText}>
                                    {filteredTechnicians.length}
                                </span>{" "}
                                of {totalTechnicians} technicians
                            </p>
                        </div>
                    </section>

                    {/* =================================================
                        TECHNICIAN LIST HEADER
                    ================================================= */}

                    <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                            <h2 className={`text-xl font-black ${headingText}`}>
                                Your Maintenance Team
                            </h2>

                            <p className={`mt-1 text-xs ${secondaryText}`}>
                                Technician profiles and assigned work areas.
                            </p>
                        </div>

                        <span className={`rounded-xl border px-3 py-2 text-xs font-black ${
                            darkMode
                                ? "border-slate-700 bg-slate-800 text-slate-300"
                                : "border-slate-200 bg-white text-slate-600"
                        }`}>
                            {filteredTechnicians.length} Members
                        </span>
                    </div>

                    {/* =================================================
                        LOADING
                    ================================================= */}

                    {fetchLoading ? (
                        <div className={`rounded-3xl border p-14 text-center ${surface}`}>
                            <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-slate-300 border-t-indigo-600" />

                            <p className={`mt-5 text-sm font-bold ${headingText}`}>
                                Loading technicians...
                            </p>

                            <p className={`mt-1 text-xs ${secondaryText}`}>
                                Fetching your maintenance team.
                            </p>
                        </div>
                    ) : filteredTechnicians.length === 0 ? (
                        /* =================================================
                            EMPTY STATE
                        ================================================= */

                        <div className={`rounded-3xl border border-dashed p-12 text-center shadow-sm ${surface}`}>
                            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                                darkMode
                                    ? "bg-slate-700"
                                    : "bg-indigo-50"
                            }`}>
                                👨‍🔧
                            </div>

                            <h3 className={`mt-5 text-lg font-black ${headingText}`}>
                                {technicians.length === 0
                                    ? "No technicians found"
                                    : "No matching technicians"}
                            </h3>

                            <p className={`mx-auto mt-2 max-w-md text-sm leading-6 ${secondaryText}`}>
                                {technicians.length === 0
                                    ? "Start building your maintenance team by adding your first technician."
                                    : "Try changing your search term or specialization filter."}
                            </p>

                            {technicians.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                                >
                                    + Add First Technician
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchTerm("");
                                        setSpecializationFilter("All");
                                    }}
                                    className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                                >
                                    Clear Filters
                                </button>
                            )}
                        </div>
                    ) : (
                        /* =================================================
                            TECHNICIAN CARDS
                        ================================================= */

                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {filteredTechnicians.map((technician) => {
                                const specialization =
                                    technician.specialization || "General";

                                return (
                                    <article
                                        key={technician._id}
                                        className={`group overflow-hidden rounded-2xl border shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl ${
                                            darkMode
                                                ? "border-slate-700 bg-slate-800 hover:border-indigo-500/50"
                                                : "border-slate-200 bg-white hover:border-indigo-200"
                                        }`}
                                    >
                                        {/* CARD TOP */}

                                        <div className={`relative border-b p-5 ${
                                            darkMode
                                                ? "border-slate-700 bg-slate-900/50"
                                                : "border-slate-100 bg-slate-50"
                                        }`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                                                    darkMode
                                                        ? "bg-indigo-500/15"
                                                        : "bg-indigo-100"
                                                }`}>
                                                    👨‍🔧
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <h3 className={`truncate text-base font-black ${headingText}`}>
                                                        {technician.name}
                                                    </h3>

                                                    <p className={`mt-1 truncate text-xs ${secondaryText}`}>
                                                        {technician.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CARD DETAILS */}

                                        <div className="p-5">
                                            <div className="mb-4">
                                                <p className={`mb-2 text-[10px] font-black uppercase tracking-widest ${secondaryText}`}>
                                                    Specialization
                                                </p>

                                                <span className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold ${getSpecializationColor(specialization)}`}>
                                                    {getSpecializationIcon(specialization)}
                                                    {specialization}
                                                </span>
                                            </div>

                                            <div className={`mb-4 flex items-start gap-3 rounded-xl border p-3 ${
                                                darkMode
                                                    ? "border-slate-700 bg-slate-900/60"
                                                    : "border-slate-100 bg-slate-50"
                                            }`}>
                                                <span className="text-lg">🏢</span>

                                                <div className="min-w-0">
                                                    <p className={`text-[9px] font-black uppercase tracking-wider ${secondaryText}`}>
                                                        Assigned Blocks
                                                    </p>

                                                    <p className={`mt-1 break-words text-xs font-bold ${bodyText}`}>
                                                        {technician.assignedBlocks?.join(", ") ||
                                                            "Not assigned"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-5 flex items-center justify-between">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${secondaryText}`}>
                                                    Account Role
                                                </span>

                                                <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black ${
                                                    darkMode
                                                        ? "bg-emerald-500/10 text-emerald-300"
                                                        : "bg-emerald-50 text-emerald-700"
                                                }`}>
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    Technician
                                                </span>
                                            </div>

                                            {/* DELETE */}

                                            <button
                                                type="button"
                                                disabled={deletingId === technician._id}
                                                onClick={() =>
                                                    handleDeleteTechnician(
                                                        technician._id
                                                    )
                                                }
                                                className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                                    darkMode
                                                        ? "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                        : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                                }`}
                                            >
                                                {deletingId === technician._id
                                                    ? "Deleting..."
                                                    : "🗑️ Delete Technician"}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* =====================================================
                ADD TECHNICIAN MODAL
            ===================================================== */}

            {showAddModal && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
                    onClick={closeModal}
                >
                    <div
                        className={`max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl border shadow-2xl ${
                            darkMode
                                ? "border-slate-700 bg-slate-900"
                                : "border-slate-200 bg-white"
                        }`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* MODAL HEADER */}

                        <div className={`sticky top-0 z-10 flex items-center justify-between border-b px-6 py-5 ${
                            darkMode
                                ? "border-slate-700 bg-slate-900"
                                : "border-slate-100 bg-white"
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${
                                    darkMode
                                        ? "bg-indigo-500/15"
                                        : "bg-indigo-100"
                                }`}>
                                    👨‍🔧
                                </div>

                                <div>
                                    <h2 className={`text-lg font-black ${headingText}`}>
                                        Add New Technician
                                    </h2>

                                    <p className={`mt-0.5 text-xs ${secondaryText}`}>
                                        Create a technician account
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={loading}
                                className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition disabled:opacity-50 ${
                                    darkMode
                                        ? "text-slate-400 hover:bg-slate-700 hover:text-white"
                                        : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                            >
                                ✕
                            </button>
                        </div>

                        {/* FORM */}

                        <form
                            onSubmit={handleAddTechnician}
                            className="space-y-5 p-6"
                        >
                            {/* NAME */}

                            <div>
                                <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="Enter technician name"
                                    required
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputClass}`}
                                />
                            </div>

                            {/* EMAIL */}

                            <div>
                                <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="technician@campus.com"
                                    required
                                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${inputClass}`}
                                />
                            </div>

                            {/* BLOCK */}

                            <div>
                                <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                                    Assigned Block
                                </label>

                                <select
                                    name="block"
                                    value={formData.block}
                                    onChange={handleChange}
                                    required
                                    disabled={assignedBlocks.length === 0}
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition disabled:opacity-50 ${inputClass}`}
                                >
                                    {assignedBlocks.length === 0 ? (
                                        <option value="">
                                            No block assigned
                                        </option>
                                    ) : (
                                        assignedBlocks.map((block) => (
                                            <option
                                                key={block}
                                                value={block}
                                            >
                                                {block}
                                            </option>
                                        ))
                                    )}
                                </select>

                                <p className={`mt-2 text-[10px] ${secondaryText}`}>
                                    Only blocks assigned to your supervisor account are available.
                                </p>
                            </div>

                            {/* SPECIALIZATION */}

                            <div>
                                <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                                    Specialization
                                </label>

                                <select
                                    name="specialization"
                                    value={formData.specialization}
                                    onChange={handleChange}
                                    required
                                    className={`w-full rounded-xl border px-4 py-3 text-sm font-semibold outline-none transition ${inputClass}`}
                                >
                                    <option value="Electrician">
                                        Electrician
                                    </option>

                                    <option value="Computer Technician">
                                        Computer Technician
                                    </option>

                                    <option value="AC Technician">
                                        AC Technician
                                    </option>

                                    <option value="Carpenter">
                                        Carpenter
                                    </option>

                                    <option value="Plumber">
                                        Plumber
                                    </option>

                                    <option value="General">
                                        General
                                    </option>
                                </select>
                            </div>

                            {/* PASSWORD */}

                            <div>
                                <label className={`mb-2 block text-xs font-black ${bodyText}`}>
                                    Initial Password
                                </label>

                                <div className="relative">
                                    <input
                                        type={
                                            showPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Minimum 6 characters"
                                        minLength={6}
                                        required
                                        className={`w-full rounded-xl border px-4 py-3 pr-14 text-sm outline-none transition ${inputClass}`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword((previous) => !previous)
                                        }
                                        className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm transition ${
                                            darkMode
                                                ? "text-slate-400 hover:bg-slate-700"
                                                : "text-slate-500 hover:bg-slate-100"
                                        }`}
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>

                                <p className={`mt-2 text-[10px] ${secondaryText}`}>
                                    Password must contain at least 6 characters.
                                </p>
                            </div>

                            {/* ERROR */}

                            {errorMessage && (
                                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                                    darkMode
                                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                                        : "border-red-200 bg-red-50 text-red-700"
                                }`}>
                                    ⚠️ {errorMessage}
                                </div>
                            )}

                            {/* SUCCESS */}

                            {message && (
                                <div className={`rounded-xl border p-3 text-xs font-semibold ${
                                    darkMode
                                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                }`}>
                                    ✓ {message}
                                </div>
                            )}

                            {/* BUTTONS */}

                            <div className={`flex gap-3 border-t pt-5 ${
                                darkMode
                                    ? "border-slate-700"
                                    : "border-slate-100"
                            }`}>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={loading}
                                    className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition disabled:opacity-50 ${
                                        darkMode
                                            ? "border-slate-600 bg-slate-800 text-slate-300 hover:bg-slate-700"
                                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        assignedBlocks.length === 0
                                    }
                                    className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loading
                                        ? "Creating..."
                                        : "Create Technician →"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LOGOUT MODAL */}

            {showLogout && (
                <LogoutModal
                    isOpen={showLogout}
                    onClose={() => setShowLogout(false)}
                />
            )}
        </div>
    );
}

export default SupervisorTechnicians;
