import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useTheme } from "../context/ThemeContext";

const CAMPUS_BLOCKS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  .split("")
  .map((letter) => `${letter} Block`);

const generateRooms = (start, end) =>
  Array.from(
    { length: end - start + 1 },
    (_, index) => `Room ${start + index}`
  );

const BLOCK_FLOOR_ROOM_DATA = {
  "A Block": [
    { floor: "A1", rooms: generateRooms(1, 10) },
    { floor: "A2", rooms: generateRooms(11, 20) },
    { floor: "A3", rooms: generateRooms(21, 30) },
    { floor: "A4", rooms: generateRooms(31, 40) },
  ],
  "B Block": [
    { floor: "B1", rooms: generateRooms(1, 15) },
    { floor: "B2", rooms: generateRooms(16, 30) },
    { floor: "B3", rooms: generateRooms(31, 45) },
    { floor: "B4", rooms: generateRooms(46, 60) },
  ],
  "C Block": [
    { floor: "C1", rooms: generateRooms(1, 5) },
    { floor: "C2", rooms: generateRooms(6, 10) },
  ],
  "D Block": [
    { floor: "D1", rooms: generateRooms(1, 20) },
    { floor: "D2", rooms: generateRooms(21, 40) },
    { floor: "D3", rooms: generateRooms(41, 60) },
    { floor: "D4", rooms: generateRooms(61, 80) },
  ],
  "V Block": [
    { floor: "V1", rooms: generateRooms(1, 10) },
    { floor: "V2", rooms: generateRooms(11, 20) },
    { floor: "V3", rooms: generateRooms(21, 30) },
    { floor: "V4", rooms: generateRooms(31, 40) },
    { floor: "V5", rooms: generateRooms(41, 50) },
  ],
};

function getBlockFloorsAndRooms(blockName) {
  if (!blockName) return [];

  if (BLOCK_FLOOR_ROOM_DATA[blockName]) {
    return BLOCK_FLOOR_ROOM_DATA[blockName];
  }

  const match = blockName.match(/^([A-Za-z]+)\s*Block$/i);

  const prefix = match
    ? match[1].toUpperCase()
    : blockName
      .split(/\s+/)
      .map((word) => word[0]?.toUpperCase() || "")
      .join("");

  return [1, 2, 3, 4].map((floor) => ({
    floor: `${prefix}${floor}`,
    rooms: generateRooms((floor - 1) * 10 + 1, floor * 10),
  }));
}

const initialFormData = (user) => ({
  block: "",
  floor: "",
  room: "",
  mobileNumber: user?.phoneNumber || "",
  category: "",
  description: "",
  priority: "Medium",
});

/* Searchable dropdown with dark mode support */
function SearchableDropdown({
  id,
  label,
  required = false,
  value,
  onChange,
  options = [],
  placeholder = "Search or select...",
  searchPlaceholder = "Search...",
  disabled = false,
  disabledPlaceholder = "Select previous field first...",
  emptyMessage = "No options found",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const containerRef = useRef(null);
  const searchRef = useRef(null);

  const filtered = options.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (disabled) {
      setOpen(false);
      setSearch("");
    }
  }, [disabled]);

  const handleSelect = (item) => {
    onChange(item);
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} className="relative min-w-0">
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        {label} {required && <span className="text-rose-500">*</span>}
      </label>

      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((previous) => !previous)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex min-h-[50px] w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-sm outline-none transition focus:ring-4 focus:ring-indigo-500/15 ${disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-500"
            : open
              ? "border-indigo-500 bg-white text-slate-800 ring-4 ring-indigo-500/10 dark:bg-slate-900 dark:text-slate-100"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:bg-slate-900"
          }`}
      >
        <span
          className={`truncate ${value
              ? "font-semibold text-slate-800 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"
            }`}
        >
          {value || (disabled ? disabledPlaceholder : placeholder)}
        </span>

        <span
          className={`shrink-0 text-slate-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""
            }`}
        >
          ⌄
        </span>
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_55px_-18px_rgba(15,23,42,0.3)] dark:border-slate-700 dark:bg-slate-900">
          <div className="border-b border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/70">
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-700 dark:bg-slate-900">
              <span className="text-slate-400">⌕</span>

              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full border-0 bg-transparent py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          <ul
            role="listbox"
            aria-label={label}
            className="m-0 max-h-56 list-none overflow-y-auto p-1.5"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-5 text-center text-sm text-slate-400 dark:text-slate-500">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((item) => {
                const selected = value === item;

                return (
                  <li key={item} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${selected
                          ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"
                          : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                    >
                      <span>{item}</span>
                      {selected && <span aria-hidden="true">✓</span>}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ icon, title, subtitle, number }) {
  return (
    <div className="mb-5 flex items-start gap-3.5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl ring-1 ring-indigo-100 dark:bg-indigo-500/15 dark:ring-indigo-400/20">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {number && (
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-500 dark:text-indigo-400">
              Step {number}
            </span>
          )}

          <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-white sm:text-lg">
            {title}
          </h2>
        </div>

        <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

function FieldLabel({ children, htmlFor, required = false }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
    >
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:border-indigo-400 dark:focus:bg-slate-900";

const readOnlyClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
function ComplaintForm({ darkMode }) {
  const navigate = useNavigate();
  const { darkMode: contextDark } = useTheme();

  // Single source of truth: use darkMode prop or context theme.
  const isDark =
    typeof darkMode === "boolean"
      ? darkMode
      : contextDark;

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState(() => initialFormData(user));
  const [mobileTouched, setMobileTouched] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [duplicateComplaint, setDuplicateComplaint] = useState(null);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [alreadySupported, setAlreadySupported] = useState(false);
  const [supporting, setSupporting] = useState(false);
  const [notice, setNotice] = useState(null);

  const isMobileValid = /^[0-9]{10}$/.test(formData.mobileNumber);

  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "null");

      setUser(storedUser);

      setFormData((previous) => ({
        ...previous,
        mobileNumber:
          previous.mobileNumber || storedUser?.phoneNumber || "",
      }));
    } catch {
      // Keep the form usable if local storage contains invalid JSON.
    }
  }, []);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return undefined;
    }

    const url = URL.createObjectURL(image);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const availableFloorsData = getBlockFloorsAndRooms(formData.block);
  const availableFloors = availableFloorsData.map((item) => item.floor);

  const currentFloorData = availableFloorsData.find(
    (item) => item.floor === formData.floor
  );

  const availableRooms = currentFloorData ? currentFloorData.rooms : [];

  const handleBlockChange = (block) => {
    setFormData((previous) => ({
      ...previous,
      block,
      floor: "",
      room: "",
    }));
  };

  const handleFloorChange = (floor) => {
    setFormData((previous) => ({
      ...previous,
      floor,
      room: "",
    }));
  };

  const handleRoomChange = (room) => {
    setFormData((previous) => ({ ...previous, room }));
  };

  const handleMobileChange = (event) => {
    const mobileNumber = event.target.value.replace(/\D/g, "").slice(0, 10);

    setFormData((previous) => ({ ...previous, mobileNumber }));
    setMobileTouched(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const resetForm = () => {
    setFormData(initialFormData(user));
    setMobileTouched(false);
    setImage(null);
    setImagePreview("");
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setNotice(null);

    if (!isMobileValid) {
      setMobileTouched(true);

      setNotice({
        type: "error",
        text:
          "Please enter a valid 10-digit mobile number in your account profile.",
      });

      return;
    }

    if (
      !formData.block ||
      !formData.floor ||
      !formData.room ||
      !formData.category ||
      !formData.description.trim() ||
      !image
    ) {
      setNotice({
        type: "error",
        text:
          "Please complete all required fields and upload a photo before submitting.",
      });

      return;
    }

    const validFloorData = getBlockFloorsAndRooms(formData.block).find(
      (floor) => floor.floor === formData.floor
    );

    if (!validFloorData || !validFloorData.rooms.includes(formData.room)) {
      setNotice({
        type: "error",
        text:
          "The selected block, floor and room combination is invalid. Please select the location again.",
      });

      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Your session could not be found. Please sign in again.");
      }

      const uploadData = new FormData();

      uploadData.append("file", image);
      uploadData.append("upload_preset", "campusfix_upload");

      const cloudinaryResponse = await fetch(
        "https://api.cloudinary.com/v1_1/m7gxszmr/image/upload",
        {
          method: "POST",
          body: uploadData,
        }
      );

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryResponse.ok || !cloudinaryData.secure_url) {
        throw new Error(
          cloudinaryData.error?.message ||
          "Photo upload failed. Please try another image."
        );
      }

      const response = await api.post(
        "/complaints",
        {
          ...formData,
          description: formData.description.trim(),
          image: cloudinaryData.secure_url,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNotice({
        type: "success",
        text:
          response.data.message ||
          "Your complaint has been submitted successfully.",
      });

      resetForm();

      navigate("/student/complaints", {
        state: {
          successMessage:
            response.data.message || "Complaint submitted successfully.",
        },
      });
    } catch (error) {
      if (
        error.response?.status === 409 &&
        error.response?.data?.duplicate
      ) {
        const duplicateData = error.response.data;

        setDuplicateComplaint(duplicateData.complaint);

        setDuplicateMessage(
          duplicateData.message || "A similar active complaint already exists."
        );

        setAlreadySupported(duplicateData.alreadySupported || false);
      } else {
        setNotice({
          type: "error",
          text:
            error.response?.data?.message ||
            error.message ||
            "Failed to submit complaint. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSupportComplaint = async () => {
    if (!duplicateComplaint?._id) return;

    try {
      setSupporting(true);

      const token = localStorage.getItem("token");

      const response = await api.post(
        `/complaints/${duplicateComplaint._id}/support`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDuplicateComplaint(null);
      setDuplicateMessage("");
      setAlreadySupported(false);

      navigate("/student/complaints", {
        state: {
          successMessage:
            response.data.message || "Your support has been added.",
        },
      });
    } catch (error) {
      setNotice({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to support the existing complaint.",
      });
    } finally {
      setSupporting(false);
    }
  };

  const closeDuplicateModal = () => {
    setDuplicateComplaint(null);
    setDuplicateMessage("");
    setAlreadySupported(false);
  };

  const supporterCount = duplicateComplaint?.supporters?.length || 0;

  return (
    <div
      className={`transition-colors duration-200 ${isDark ? "dark" : ""}`}
      data-theme={isDark ? "dark" : "light"}
    >
      <div className="min-h-screen overflow-x-hidden bg-[#f6f7fb] text-slate-800 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        {/* Navigation */}
        <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
              <div className="flex h-12 items-center rounded-xl border border-slate-100 bg-white px-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-8 w-auto object-contain sm:h-9"
                />
              </div>

              <div className="min-w-0 border-l border-slate-200 pl-3 dark:border-slate-700 sm:pl-4">
                <p className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                  Campus<span className="text-indigo-600 dark:text-indigo-400">Fix</span>
                </p>

                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Campus Maintenance Management
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/student")}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-indigo-500 dark:hover:text-indigo-300 sm:px-4"
            >
              <span aria-hidden="true">←</span>
              <span>Dashboard</span>
            </button>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          {/* Hero header */}
          <div className="mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#3730a3] via-indigo-700 to-violet-700 dark:from-indigo-950 dark:via-indigo-900 dark:to-slate-900 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8 lg:p-10">
            <div className="relative z-0 flex flex-col justify-between gap-7 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-indigo-50 backdrop-blur">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  STUDENT SUPPORT · MAINTENANCE REQUEST
                </div>

                <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-[42px]">
                  Report a Problem<span className="text-indigo-200">.</span>
                </h1>

                <p className="mt-3 max-w-xl text-sm leading-6 text-indigo-100 sm:text-base sm:leading-7">
                  Help us keep your campus running smoothly. Share the location,
                  describe the issue and attach a photo so the right team can act
                  faster.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-xs font-medium text-white/90 sm:text-sm">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                    ✓ Easy reporting
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                    ✓ Photo evidence
                  </span>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-2">
                    ✓ Trackable request
                  </span>
                </div>
              </div>

              <div className="hidden shrink-0 md:block">
                <div className="relative flex h-36 w-36 items-center justify-center rounded-[32px] border border-white/20 bg-white/10 shadow-inner backdrop-blur-sm lg:h-44 lg:w-44">
                  <div className="absolute inset-3 rounded-[25px] border border-white/15" />
                  <span className="text-6xl drop-shadow-sm lg:text-7xl" aria-hidden="true">
                    🛠️
                  </span>
                  <span className="absolute -right-3 -top-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400 text-xl text-emerald-950 shadow-lg">
                    ✓
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
            {/* Main form card */}
            <section className="min-w-0 overflow-visible rounded-3xl border border-slate-200/80 bg-white shadow-[0_12px_40px_-24px_rgba(15,23,42,0.25)] dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-8">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                    New maintenance request
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
                    Complaint details
                  </h2>
                </div>

                <div className="hidden rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 sm:block">
                  ● Secure submission
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 p-5 sm:p-8" noValidate>
                {notice && (
                  <div
                    role="status"
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-sm ${notice.type === "error"
                        ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200"
                        : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/30 dark:text-emerald-200"
                      }`}
                  >
                    <span className="text-lg">
                      {notice.type === "error" ? "⚠️" : "✓"}
                    </span>
                    <p className="leading-6">{notice.text}</p>
                  </div>
                )}

                {/* Student information */}
                <section>
                  <SectionHeading
                    icon="👤"
                    title="Student information"
                    subtitle="Your account details help the team identify and contact you."
                    number="01"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <FieldLabel>Name</FieldLabel>
                        <div className={readOnlyClass}>{user?.name || "Not available"}</div>
                      </div>

                      <div>
                        <FieldLabel>Email</FieldLabel>
                        <div className={`${readOnlyClass} break-all`}>
                          {user?.email || "Not available"}
                        </div>
                      </div>

                      <div>
                        <FieldLabel>Class / Section</FieldLabel>
                        <div className={readOnlyClass}>
                          {user?.classSection || "Not available"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                      <div className="max-w-md">
                        <FieldLabel htmlFor="mobileNumber" required>
                          Contact mobile number
                        </FieldLabel>

                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-semibold text-slate-400">
                            +91
                          </div>

                          <input
                            id="mobileNumber"
                            type="tel"
                            name="mobileNumber"
                            value={formData.mobileNumber}
                            onChange={handleMobileChange}
                            maxLength={10}
                            inputMode="numeric"
                            required
                            aria-invalid={mobileTouched && !isMobileValid}
                            className={`${inputClass} pl-14 pr-20 ${mobileTouched && !isMobileValid
                                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                                : ""
                              }`}
                            placeholder="10-digit mobile number"
                          />

                          {isMobileValid && (
                            <span className="absolute inset-y-0 right-3 flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              ✓ Valid
                            </span>
                          )}
                        </div>

                        <p
                          className={`mt-2 text-xs leading-5 ${mobileTouched && !isMobileValid
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-slate-500 dark:text-slate-400"
                            }`}
                        >
                          {mobileTouched && !isMobileValid
                            ? "Enter a valid 10-digit mobile number."
                            : "The maintenance team may contact you about this request."}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Location */}
                <section>
                  <SectionHeading
                    icon="📍"
                    title="Problem location"
                    subtitle="Select the exact location so the team knows where to go."
                    number="02"
                  />

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <SearchableDropdown
                      id="block-select"
                      label="Campus block"
                      required
                      value={formData.block}
                      onChange={handleBlockChange}
                      options={CAMPUS_BLOCKS}
                      placeholder="Choose a block"
                      searchPlaceholder="Search blocks..."
                      emptyMessage="No blocks found"
                    />

                    <SearchableDropdown
                      id="floor-select"
                      label="Floor"
                      required
                      value={formData.floor}
                      onChange={handleFloorChange}
                      options={availableFloors}
                      placeholder="Choose a floor"
                      searchPlaceholder="Search floors..."
                      disabled={!formData.block}
                      disabledPlaceholder="Choose block first"
                      emptyMessage="No floors available"
                    />

                    <SearchableDropdown
                      id="room-select"
                      label="Room"
                      required
                      value={formData.room}
                      onChange={handleRoomChange}
                      options={availableRooms}
                      placeholder="Choose a room"
                      searchPlaceholder="Search rooms..."
                      disabled={!formData.floor}
                      disabledPlaceholder="Choose floor first"
                      emptyMessage="No rooms available"
                    />
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-5 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200">
                    <span className="mt-px text-base">💡</span>
                    <p>
                      <strong>Tip:</strong> Choose the block first, then the floor
                      and room. The available options update automatically.
                    </p>
                  </div>
                </section>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />


                {/* Problem details */}
                <section>
                  <SectionHeading
                    icon="🔧"
                    title="Problem information"
                    subtitle="Describe what is wrong and select the closest matching category."
                    number="03"
                  />

                  <div className="space-y-5">
                    <div>
                      <FieldLabel htmlFor="category" required>
                        Problem category
                      </FieldLabel>

                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className={`${inputClass} cursor-pointer`}
                      >
                        <option value="" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Select a category</option>
                        <option value="Fan" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Fan</option>
                        <option value="Light" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Light</option>
                        <option value="Electrical" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Electrical</option>
                        <option value="Projector" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Projector</option>
                        <option value="Computer" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Computer</option>
                        <option value="AC" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Air conditioning (AC)</option>
                        <option value="Door" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Door</option>
                        <option value="Furniture" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Furniture</option>
                        <option value="Plumbing" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Plumbing</option>
                        <option value="Other" className="bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">Other</option>
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <FieldLabel htmlFor="description" required>
                          Describe the problem
                        </FieldLabel>
                        <span className="text-xs text-slate-400">
                          {formData.description.length}/1000
                        </span>
                      </div>

                      <textarea
                        id="description"
                        name="description"
                        placeholder="Explain what happened, where it happens, and any details that may help. For example: The projector powers on, but no image appears on the screen."
                        value={formData.description}
                        onChange={(event) => {
                          if (event.target.value.length <= 1000) {
                            handleChange(event);
                          }
                        }}
                        rows={5}
                        required
                        maxLength={1000}
                        className={`${inputClass} min-h-[140px] resize-y leading-6`}
                      />

                      <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        <span>✦</span>
                        <span>
                          A clear description helps the maintenance team
                          understand the issue faster.
                        </span>
                      </p>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Photo upload */}
                <section>
                  <SectionHeading
                    icon="📷"
                    title="Photo evidence"
                    subtitle="Upload a clear picture of the issue. A photo is required for submission."
                    number="04"
                  />

                  <label
                    htmlFor="problem-image"
                    className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition sm:py-9 ${image
                        ? "border-indigo-300 bg-indigo-50/60 dark:border-indigo-700 dark:bg-indigo-950/20"
                        : "border-slate-300 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/60 dark:border-slate-700 dark:bg-slate-950/30 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20"
                      }`}
                  >
                    {imagePreview ? (
                      <div className="w-full max-w-sm">
                        <img
                          src={imagePreview}
                          alt="Preview of uploaded problem"
                          className="mx-auto max-h-56 rounded-xl border border-slate-200 object-contain shadow-sm dark:border-slate-700"
                        />

                        <p className="mt-3 break-all text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          {image?.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Click to replace this photo
                        </p>
                      </div>
                    ) : (
                      <>
                        <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl text-slate-700 shadow-sm ring-1 ring-slate-200 transition group-hover:-translate-y-1 dark:bg-slate-900 dark:ring-slate-700 dark:text-slate-200">
                          ↑
                        </span>

                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          Click to upload or choose a photo
                        </p>

                        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                          PNG, JPG or WebP · Max 8 MB recommended
                        </p>
                      </>
                    )}

                    <input
                      id="problem-image"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file) return;

                        if (!/^image\/(png|jpeg|webp)$/.test(file.type)) {
                          setNotice({
                            type: "error",
                            text: "Please choose a PNG, JPG or WebP image.",
                          });
                          event.target.value = "";
                          return;
                        }

                        if (file.size > 8 * 1024 * 1024) {
                          setNotice({
                            type: "error",
                            text:
                              "This image is larger than 8 MB. Please choose a smaller photo.",
                          });
                          event.target.value = "";
                          return;
                        }

                        setNotice(null);
                        setImage(file);
                      }}
                    />
                  </label>

                  {image && (
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="mt-3 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400"
                    >
                      Remove selected photo
                    </button>
                  )}
                </section>

                <div className="h-px bg-slate-100 dark:bg-slate-800" />

                {/* Priority */}
                <section>
                  <SectionHeading
                    icon="⚡"
                    title="Priority level"
                    subtitle="Choose how urgently this problem needs attention."
                    number="05"
                  />

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      {
                        value: "Low",
                        title: "Low priority",
                        description: "Can be fixed later",
                        icon: "○",
                        style:
                          "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900 dark:bg-sky-950/30 dark:text-sky-200",
                      },
                      {
                        value: "Medium",
                        title: "Medium priority",
                        description: "Needs attention",
                        icon: "◉",
                        style:
                          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
                      },
                      {
                        value: "High",
                        title: "High priority",
                        description: "Urgent attention",
                        icon: "⚡",
                        style:
                          "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200",
                      },
                    ].map((option) => {
                      const selected = formData.priority === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            setFormData((previous) => ({
                              ...previous,
                              priority: option.value,
                            }))
                          }
                          aria-pressed={selected}
                          className={`relative rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selected
                              ? `${option.style} ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-[#0d1525]`
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-600"
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-lg">{option.icon}</span>

                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${selected
                                  ? "border-indigo-600 bg-indigo-600 text-white"
                                  : "border-slate-300 text-transparent dark:border-slate-600"
                                }`}
                            >
                              ✓
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-bold">
                            {option.title}
                          </p>

                          <p
                            className={`mt-1 text-xs ${selected
                                ? "opacity-80"
                                : "text-slate-400 dark:text-slate-500"
                              }`}
                          >
                            {option.description}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Submit section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">🔒</span>

                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        Review before submitting
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                        Please verify the selected location and contact number.
                        Your details and photo will be attached to this
                        maintenance request.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={submitting}
                      className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      Reset form
                    </button>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:from-indigo-700 hover:to-violet-700 hover:shadow-indigo-600/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:min-w-56"
                    >
                      {submitting ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          Uploading & submitting...
                        </>
                      ) : (
                        <>
                          Submit complaint <span aria-hidden="true">→</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </section>


            {/* Helpful sidebar */}
            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-500/10">
                    ✦
                  </span>

                  <h3 className="font-extrabold text-slate-900 dark:text-white">
                    How it works
                  </h3>
                </div>

                <ol className="mt-5 space-y-4">
                  {[
                    ["01", "Tell us the location", "Select the block, floor and room."],
                    ["02", "Add issue details", "Choose a category and explain the problem."],
                    ["03", "Attach a photo", "A clear image helps the team assess it."],
                    ["04", "Submit & track", "Your request is sent to the maintenance system."],
                  ].map(([number, title, description], index) => (
                    <li key={number} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {number}
                      </span>

                      <div className={index === 3 ? "" : "pb-3"}>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {title}
                        </p>

                        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-indigo-900/10 sm:p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 text-2xl">
                  💡
                </span>

                <h3 className="mt-4 text-lg font-extrabold">
                  Help us resolve it faster
                </h3>

                <p className="mt-2 text-sm leading-6 text-indigo-100">
                  Be specific about the issue, choose the correct room and
                  upload a well-lit photo. It helps the maintenance team
                  understand what needs attention.
                </p>

                <button
                  type="button"
                  onClick={() => navigate("/student/complaints")}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20"
                >
                  View my complaints <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex gap-3">
                  <span className="text-lg">🛡️</span>

                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                      Your details stay with your request
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Your contact information helps campus staff follow up if
                      more details are needed.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-8 border-t border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-[#0b1220]/70">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
            <div>
              <p className="font-extrabold text-slate-800 dark:text-slate-200">
                CampusFix
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Medi-Caps University
              </p>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
              Smart Campus <span className="mx-1.5">·</span> Faster Resolution
              <span className="mx-1.5">·</span> Better Management
            </p>
          </div>
        </footer>

        {/* Duplicate complaint modal */}
        {duplicateComplaint && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                closeDuplicateModal();
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="duplicate-title"
              className="my-auto max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0d1525]"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 dark:border-slate-800 sm:px-7">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl dark:bg-amber-500/15">
                    ⚠️
                  </span>

                  <div>
                    <h2
                      id="duplicate-title"
                      className="text-lg font-extrabold text-slate-900 dark:text-white"
                    >
                      Similar complaint found
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                      {duplicateMessage}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  aria-label="Close dialog"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-5 p-5 sm:p-7">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Existing complaint
                  </p>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-400">Location</p>
                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {duplicateComplaint.block}
                        {duplicateComplaint.floor
                          ? ` · Floor ${duplicateComplaint.floor}`
                          : ""}
                        {duplicateComplaint.room
                          ? ` · ${duplicateComplaint.room.startsWith("Room")
                            ? duplicateComplaint.room
                            : `Room ${duplicateComplaint.room}`
                          }`
                          : ""}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Category</p>
                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {duplicateComplaint.category}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Status</p>
                      <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {duplicateComplaint.status}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">Priority</p>
                      <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                        {duplicateComplaint.priority || "Medium"}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                    Problem description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {duplicateComplaint.description}
                  </p>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                  <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-500 dark:text-indigo-300">
                    Reported by
                  </p>

                  <p className="mt-1 font-bold text-indigo-950 dark:text-indigo-100">
                    {duplicateComplaint.user?.name || "Student"}
                  </p>

                  {duplicateComplaint.user?.classSection && (
                    <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">
                      {duplicateComplaint.user.classSection}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/25">
                  <div>
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      Students affected
                    </p>

                    <p className="mt-1 text-xs leading-5 text-emerald-700 dark:text-emerald-300">
                      Supporting this request helps the admin understand its
                      impact.
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-extrabold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
                    {supporterCount + 1}
                  </div>
                </div>

                <div className="space-y-3">
                  {!alreadySupported ? (
                    <button
                      type="button"
                      onClick={handleSupportComplaint}
                      disabled={supporting}
                      className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {supporting
                        ? "Adding your support..."
                        : "👍 Support this complaint"}
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-center text-sm font-bold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                      ✓ You have already supported this complaint
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={closeDuplicateModal}
                    className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    Back to form
                  </button>
                </div>

                <p className="text-center text-xs leading-5 text-slate-400 dark:text-slate-500">
                  You don't need to submit another complaint for the same issue.
                  Supporting the existing request keeps reports organized.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComplaintForm;