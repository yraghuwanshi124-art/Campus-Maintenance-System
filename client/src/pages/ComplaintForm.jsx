
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

// ================= CAMPUS BLOCK LIST =================
// Medi-Caps University campus blocks — single source of truth for the form
const CAMPUS_BLOCKS = [
  "A Block",
  "B Block",
  "C Block",
  "D Block",
  "E Block",
  "F Block",
  "G Block",
  "H Block",
  "I Block",
  "J Block",
  "K Block",
  "L Block",
  "M Block",
  "N Block",
  "O Block",
  "P Block",
  "Q Block",
  "R Block",
  "S Block",
  "T Block",
  "U Block",
  "V Block",
  "W Block",
  "X Block",
  "Y Block",
  "Z Block",

];

// ================= CAMPUS BLOCK, FLOOR & ROOM CONFIGURATION =================

const generateRooms = (start, end) => {
  const rooms = [];
  for (let i = start; i <= end; i++) {
    rooms.push(`Room ${i}`);
  }
  return rooms;
};

// Explicit floor & room mappings for blocks with defined structures
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
  ]
};

function getBlockFloorsAndRooms(blockName) {
  if (!blockName) return [];
  if (BLOCK_FLOOR_ROOM_DATA[blockName]) {
    return BLOCK_FLOOR_ROOM_DATA[blockName];
  }

  // Derive floor prefix for any block (e.g., "E Block" -> "E", "Z Block" -> "Z", "AB Block" -> "AB")
  let prefix = "";
  const match = blockName.match(/^([A-Za-z]+)\s*Block$/i);
  if (match) {
    prefix = match[1].toUpperCase();
  } else {
    const words = blockName.split(/\s+/);
    prefix = words.map((w) => w[0].toUpperCase()).join("");
  }

  // Sensible default: 4 floors with 10 rooms each
  return [
    { floor: `${prefix}1`, rooms: generateRooms(1, 10) },
    { floor: `${prefix}2`, rooms: generateRooms(11, 20) },
    { floor: `${prefix}3`, rooms: generateRooms(21, 30) },
    { floor: `${prefix}4`, rooms: generateRooms(31, 40) },
  ];
}

// ================= REUSABLE SEARCHABLE DROPDOWN COMPONENT =================

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

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-focus search when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  // Close when disabled becomes true
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

  const handleToggle = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    if (!open) setSearch("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={[
          "flex w-full items-center justify-between rounded-xl border px-3.5 py-3.5 text-sm outline-none transition text-left",
          disabled
            ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75"
            : open
              ? "border-indigo-500 bg-white ring-4 ring-indigo-100 cursor-pointer"
              : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-white cursor-pointer",
          value && !disabled ? "font-medium text-slate-800" : "text-slate-400",
        ].join(" ")}
      >
        <span className="flex items-center gap-2 truncate">
          <span className="shrink-0 text-slate-400 text-xs">🔍</span>
          <span className="truncate">
            {value || (disabled ? disabledPlaceholder : placeholder)}
          </span>
        </span>
        <span
          className="ml-2 shrink-0 text-slate-400 text-xs"
          style={{
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        >
          &#9662;
        </span>
      </button>

      {/* Dropdown panel */}
      {open && !disabled && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 999,
            background: "#fff",
            border: "1.5px solid #e0e7ff",
            borderRadius: "16px",
            boxShadow:
              "0 8px 32px 0 rgba(99,102,241,0.13), 0 2px 8px 0 rgba(0,0,0,0.07)",
            overflow: "hidden",
            animation: "cf-dropdown-in 0.18s cubic-bezier(.4,0,.2,1)",
          }}
        >
          {/* Search box */}
          <div
            style={{
              padding: "10px 12px 8px",
              borderBottom: "1px solid #f1f5f9",
              background: "#f8faff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fff",
                border: "1.5px solid #c7d2fe",
                borderRadius: "10px",
                padding: "7px 12px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#818cf8" }}>
                &#128269;
              </span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: "13px",
                  color: "#334155",
                  width: "100%",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#94a3b8",
                    fontSize: "13px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label="Clear search"
                >
                  &#x2715;
                </button>
              )}
            </div>
          </div>

          {/* Options list */}
          <ul
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              margin: 0,
              padding: "6px 0",
              listStyle: "none",
            }}
          >
            {filtered.length === 0 ? (
              <li
                style={{
                  padding: "14px 16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                {emptyMessage}
              </li>
            ) : (
              filtered.map((item) => {
                const isSelected = value === item;
                return (
                  <li
                    key={item}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(item)}
                    style={{
                      padding: "10px 14px",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? "#4f46e5" : "#334155",
                      background: isSelected ? "#eef2ff" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderRadius: "8px",
                      margin: "1px 6px",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "#f8faff";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && (
                      <span
                        style={{
                          color: "#4f46e5",
                          fontSize: "13px",
                          fontWeight: 800,
                          marginLeft: "6px",
                        }}
                      >
                        &#10003;
                      </span>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}

      {/* Dropdown open animation */}
      <style>{`
        @keyframes cf-dropdown-in {
          from { opacity: 0; transform: translateY(-6px) scaleY(0.97); }
          to   { opacity: 1; transform: translateY(0)   scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// Backward compatibility wrapper
function BlockDropdown(props) {
  return (
    <SearchableDropdown
      id="block-dropdown-trigger"
      label="Block"
      required
      options={CAMPUS_BLOCKS}
      placeholder="Search or select block..."
      searchPlaceholder="Search block..."
      emptyMessage="No blocks found"
      {...props}
    />
  );
}

function ComplaintForm({ isEmbedded = false }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const [formData, setFormData] = useState({
    block: "",
    floor: "",
    room: "",
    mobileNumber: user?.phoneNumber || "",
    category: "",
    description: "",
    priority: "Medium",
  });

  const [mobileTouched, setMobileTouched] = useState(false);
  const isMobileValid = /^[0-9]{10}$/.test(formData.mobileNumber);

  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Duplicate complaint states
  const [duplicateComplaint, setDuplicateComplaint] = useState(null);
  const [duplicateMessage, setDuplicateMessage] = useState("");
  const [alreadySupported, setAlreadySupported] = useState(false);
  const [supporting, setSupporting] = useState(false);

  // Dependent options
  const availableFloorsData = getBlockFloorsAndRooms(formData.block);
  const availableFloors = availableFloorsData.map((f) => f.floor);
  const currentFloorData = availableFloorsData.find(
    (f) => f.floor === formData.floor
  );
  const availableRooms = currentFloorData ? currentFloorData.rooms : [];

  // Dependent selection handlers
  const handleBlockChange = (selectedBlock) => {
    setFormData((prev) => ({
      ...prev,
      block: selectedBlock,
      floor: "",
      room: "",
    }));
  };

  const handleFloorChange = (selectedFloor) => {
    setFormData((prev) => ({
      ...prev,
      floor: selectedFloor,
      room: "",
    }));
  };

  const handleRoomChange = (selectedRoom) => {
    setFormData((prev) => ({
      ...prev,
      room: selectedRoom,
    }));
  };

  const handleMobileChange = (e) => {
    // Only accept numeric digits, up to 10 digits
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({
      ...prev,
      mobileNumber: cleaned,
    }));
    if (!mobileTouched) {
      setMobileTouched(true);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    const [formData, setFormData] = useState({
      block: "",
      floor: "",
      room: "",
      mobileNumber: user?.phoneNumber || "",
      category: "",
      description: "",
      priority: "Medium",
    });

    setMobileTouched(false);
    setImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate mobile number
    if (!formData.mobileNumber || !/^[0-9]{10}$/.test(formData.mobileNumber)) {
      setMobileTouched(true);
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    // Validate required fields
    if (!formData.block.trim()) {
      alert("Please select a block.");
      return;
    }

    if (!formData.floor.trim()) {
      alert("Please select a floor.");
      return;
    }

    if (!formData.room.trim()) {
      alert("Please select a room.");
      return;
    }

    // Verify valid block + floor + room combinations
    const validFloors = getBlockFloorsAndRooms(formData.block).map(
      (f) => f.floor
    );
    if (!validFloors.includes(formData.floor)) {
      alert(
        `Invalid floor "${formData.floor}" for ${formData.block}. Please select a valid floor.`
      );
      return;
    }

    const floorObj = getBlockFloorsAndRooms(formData.block).find(
      (f) => f.floor === formData.floor
    );
    if (!floorObj || !floorObj.rooms.includes(formData.room)) {
      alert(
        `Invalid room "${formData.room}" for floor ${formData.floor}. Please select a valid room.`
      );
      return;
    }

    if (!formData.category) {
      alert("Please select a problem category.");
      return;
    }

    if (!formData.description.trim()) {
      alert("Please describe the problem.");
      return;
    }

    if (!image) {
      alert("Please upload a photo of the problem.");
      return;
    }

    try {
      setSubmitting(true);

      const token = localStorage.getItem("token");

      let imageUrl = "";

      // Upload image to Cloudinary
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

      if (!cloudinaryResponse.ok) {
        throw new Error("Image upload failed");
      }

      imageUrl = cloudinaryData.secure_url;

      // Submit complaint
      const response = await api.post(
        "/complaints",
        {
          ...formData,
          image: imageUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert(response.data.message);

      resetForm();

      navigate("/student/complaints");
    } catch (error) {
      // Duplicate complaint found
      if (
        error.response?.status === 409 &&
        error.response?.data?.duplicate
      ) {
        const duplicateData = error.response.data;

        setDuplicateComplaint(duplicateData.complaint);
        setDuplicateMessage(
          duplicateData.message ||
          "A similar active complaint already exists."
        );
        setAlreadySupported(
          duplicateData.alreadySupported || false
        );

        return;
      }

      alert(
        error.response?.data?.message ||
        error.message ||
        "Failed to submit complaint"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Support existing complaint
  const handleSupportComplaint = async () => {
    if (!duplicateComplaint?._id) {
      return;
    }

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

      alert(response.data.message);

      setDuplicateComplaint(null);
      setDuplicateMessage("");
      setAlreadySupported(false);

      resetForm();

      navigate("/student/complaints");
    } catch (error) {
      alert(
        error.response?.data?.message ||
        "Failed to support complaint"
      );
    } finally {
      setSupporting(false);
    }
  };

  const closeDuplicateModal = () => {
    setDuplicateComplaint(null);
    setDuplicateMessage("");
    setAlreadySupported(false);
  };

  const supporterCount =
    duplicateComplaint?.supporters?.length || 0;

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-slate-50"}>
      {/* ================= NAVBAR (ONLY WHEN NOT EMBEDDED) ================= */}
      {!isEmbedded && (
        <nav className="border-b border-indigo-100 bg-indigo-50 shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            {/* Branding */}
            <div className="flex items-center gap-5">
              <div className="rounded-xl bg-white px-3 py-1.5 shadow-sm">
                <img
                  src="https://www.medicaps.ac.in/public/frontend/images/medicaps-logo-fin.webp"
                  alt="Medi-Caps University"
                  className="h-11 w-auto object-contain"
                />
              </div>

              <div className="hidden border-l-2 border-indigo-200 pl-5 sm:block">
                <p className="text-xl font-extrabold tracking-tight text-indigo-700">
                  CampusFix
                </p>

                <p className="mt-1 text-sm font-medium text-slate-600">
                  Campus Maintenance Management System
                </p>
              </div>
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => navigate("/student")}
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-100"
            >
              ← Dashboard
            </button>
          </div>
        </nav>
      )}

      {/* ================= MAIN ================= */}
      <main className={isEmbedded ? "mx-auto max-w-4xl" : "mx-auto max-w-4xl px-5 py-10 sm:px-6"}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            🛠️ Maintenance Request
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 sm:text-4xl">
            Report a Problem
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Found a maintenance issue on campus? Provide the details
            below and our maintenance team will take care of it.
          </p>
        </div>

        {/* ================= FORM CARD ================= */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-6 text-white sm:px-8">
            <h2 className="text-xl font-bold">
              Complaint Details
            </h2>

            <p className="mt-1 text-sm text-indigo-100">
              Please provide accurate information about the issue.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-7 p-6 sm:p-8"
          >
            {/* Student Information */}
            <div className="mb-7 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                  👤
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    Student Information
                  </h3>

                  <p className="text-xs text-slate-500">
                    Details from your account
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* Name */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-600">
                    Name
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {user?.name || "N/A"}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-600">
                    Email
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {user?.email || "N/A"}
                  </div>
                </div>

                {/* Class / Section */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-600">
                    Class / Section
                  </label>

                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
                    {user?.classSection || "N/A"}
                  </div>
                </div>
              </div>

              {/* Mobile Number */}
              <div className="mt-4 pt-4 border-t border-indigo-100">
                <div className="max-w-md">
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      readOnly
                      maxLength={10}
                      required
                      className={`w-full rounded-xl border bg-slate-50 px-4 py-3.5 text-sm outline-none ${isMobileValid
                        ? "border-emerald-400"
                        : "border-slate-300"
                        }`}
                    />

                    {isMobileValid && (
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-600 flex items-center gap-1">
                        <span>✓</span>
                        <span className="text-xs font-semibold text-emerald-700">Valid</span>
                      </span>
                    )}
                  </div>

                  {mobileTouched && !isMobileValid ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-500">
                      <span>✗</span>
                      <span>Please enter a valid 10-digit mobile number.</span>
                    </p>
                  ) : (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Administration/technician will use this number to contact you regarding the problem.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* ================= LOCATION ================= */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-lg">
                  📍
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    Location
                  </h3>

                  <p className="text-xs text-slate-400">
                    Where is the problem located?
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {/* 1. Block Selection */}
                <SearchableDropdown
                  id="block-select"
                  label="Block"
                  required
                  value={formData.block}
                  onChange={handleBlockChange}
                  options={CAMPUS_BLOCKS}
                  placeholder="Search or select block..."
                  searchPlaceholder="Search block..."
                  emptyMessage="No blocks found"
                />

                {/* 2. Floor Selection */}
                <SearchableDropdown
                  id="floor-select"
                  label="Floor"
                  required
                  value={formData.floor}
                  onChange={handleFloorChange}
                  options={availableFloors}
                  placeholder="Search or select floor..."
                  searchPlaceholder="Search floor..."
                  disabled={!formData.block}
                  disabledPlaceholder="Select block first..."
                  emptyMessage="No floors available"
                />

                {/* 3. Room Selection */}
                <SearchableDropdown
                  id="room-select"
                  label="Room"
                  required
                  value={formData.room}
                  onChange={handleRoomChange}
                  options={availableRooms}
                  placeholder="Search or select room..."
                  searchPlaceholder="Search room..."
                  disabled={!formData.floor}
                  disabledPlaceholder="Select floor first..."
                  emptyMessage="No rooms available"
                />
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100"></div>

            {/* ================= PROBLEM ================= */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-lg">
                  🔧
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    Problem Information
                  </h3>

                  <p className="text-sm text-slate-400">
                    Tell us what needs to be fixed.
                  </p>
                </div>
              </div>

              {/* Category */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Problem Category
                </label>

                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                >
                  <option value="">
                    Select problem category
                  </option>
                  <option value="Fan">Fan</option>
                  <option value="Light">Light</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Projector">Projector</option>
                  <option value="Computer">Computer</option>
                  <option value="AC">AC</option>
                  <option value="Door">Door</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Describe the Problem
                </label>

                <textarea
                  name="description"
                  placeholder="Explain the problem clearly. For example: The projector is turning on but no display is visible..."
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  required
                  className="w-full resize-none rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm leading-6 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                />

                <p className="mt-2 text-s text-slate-400">
                  💡 A clear description helps the technician understand
                  the issue faster.
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100"></div>

            {/* ================= PHOTO ================= */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-lg">
                  📷
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    Problem Photo
                  </h3>

                  <p className="text-sm text-slate-400">
                    Add a photo to help identify the issue.
                  </p>
                </div>
              </div>

              <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-6 py-8 text-center transition hover:border-indigo-400 hover:bg-indigo-50">
                <div className="text-4xl">📸</div>

                <p className="mt-3 font-semibold text-slate-700">
                  {image
                    ? image.name
                    : "Click to upload a photo"}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  JPG, PNG or WebP
                </p>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) =>
                    setImage(e.target.files[0])
                  }
                  className="hidden"
                />
              </label>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-100"></div>

            {/* ================= PRIORITY ================= */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-lg">
                  ⚡
                </div>

                <div>
                  <h3 className="font-bold text-slate-800">
                    Priority
                  </h3>

                  <p className="text-s text-slate-400">
                    How urgent is this problem?
                  </p>
                </div>
              </div>

              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100"
              >
                <option value="Low">
                  Low — Can be fixed later
                </option>

                <option value="Medium">
                  Medium — Needs attention
                </option>

                <option value="High">
                  High — Requires urgent attention
                </option>
              </select>
            </div>

            {/* ================= SUBMIT ================= */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4 text-base font-bold text-white shadow-lg transition hover:from-indigo-700 hover:to-purple-800 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Submitting Complaint..."
                  : "🚀 Submit Complaint"}
              </button>

              <p className="mt-3 text-center text-xs text-slate-400">
                Please verify the location and problem details before
                submitting.
              </p>
            </div>
          </form>
        </div>

        {/* ================= INFO ================= */}
        <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
          <div className="flex gap-3">
            <span className="text-xl">💡</span>

            <div>
              <p className="text-sm font-bold text-indigo-900">
                Faster Resolution Tip
              </p>

              <p className="mt-1 text-sm leading-6 text-indigo-700">
                Uploading a clear photo and providing the exact room
                number can help the maintenance team resolve your
                complaint faster.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-7">
          <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
            <div>
              <p className="font-bold text-slate-800">
                CampusFix
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Medi-Caps University
              </p>
            </div>

            <p className="text-xs text-slate-400">
              Smart Campus • Faster Resolution • Better Management
            </p>
          </div>
        </div>
      </footer>

      {/* ================= DUPLICATE COMPLAINT MODAL ================= */}
      {duplicateComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="border-b border-slate-100 px-6 py-5 sm:px-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                    ⚠️
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800">
                      Similar Complaint Found
                    </h2>

                    <p className="mt-1 text-sm leading-5 text-slate-500">
                      {duplicateMessage}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Existing Complaint */}
            <div className="space-y-5 px-6 py-6 sm:px-7">
              {/* Location */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Existing Complaint
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 font-bold text-slate-700">
                      {duplicateComplaint.block}
                      {duplicateComplaint.floor
                        ? ` • Floor ${duplicateComplaint.floor}`
                        : ""}
                      {duplicateComplaint.room
                        ? ` • ${duplicateComplaint.room.startsWith("Room")
                          ? duplicateComplaint.room
                          : `Room ${duplicateComplaint.room}`
                        }`
                        : ""}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Category
                    </p>

                    <p className="mt-1 font-bold text-slate-700">
                      {duplicateComplaint.category}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Status
                    </p>

                    <span className="mt-1 inline-flex rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                      {duplicateComplaint.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Priority
                    </p>

                    <p className="mt-1 font-bold text-slate-700">
                      {duplicateComplaint.priority || "Medium"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Problem Description
                </p>

                <p className="mt-2 rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  {duplicateComplaint.description}
                </p>
              </div>

              {/* Original Reporter */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-400">
                  Reported By
                </p>

                <p className="mt-1 font-bold text-indigo-900">
                  {duplicateComplaint.user?.name || "Student"}
                </p>

                {duplicateComplaint.user?.classSection && (
                  <p className="mt-1 text-xs text-indigo-600">
                    {duplicateComplaint.user.classSection}
                  </p>
                )}
              </div>

              {/* Support Count */}
              <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Students affected
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Supporting this complaint helps the admin see
                    how many students are affected.
                  </p>
                </div>

                <div className="ml-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-extrabold text-emerald-700">
                  {supporterCount + 1}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                {!alreadySupported ? (
                  <button
                    type="button"
                    onClick={handleSupportComplaint}
                    disabled={supporting}
                    className="w-full rounded-2xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {supporting
                      ? "Adding Your Support..."
                      : "👍 Support This Complaint"}
                  </button>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-center text-sm font-bold text-emerald-700">
                    ✓ You have already supported this complaint
                  </div>
                )}

                <button
                  type="button"
                  onClick={closeDuplicateModal}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>

              <p className="text-center text-xs leading-5 text-slate-400">
                You do not need to submit another complaint for the
                same issue. Supporting the existing complaint keeps
                the maintenance request organized.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplaintForm;
