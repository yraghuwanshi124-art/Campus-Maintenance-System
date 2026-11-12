import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import AdminSidebar from "../components/AdminSidebar";
import LogoutModal from "../components/LogoutModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function AdminMonthlyReport() {
  const { darkMode } = useTheme();
  const [complaints, setComplaints] = useState([]);
  const [showLogout, setShowLogout] = useState(false);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/complaints/all", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComplaints(response.data.complaints || []);
    } catch (error) {
      console.log("Failed to fetch complaints:", error);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyComplaints = complaints.filter((complaint) => {
    if (!complaint.createdAt) return false;

    const date = new Date(complaint.createdAt);

    return (
      date.getMonth() === currentMonth &&
      date.getFullYear() === currentYear
    );
  });

  const monthlyTotal = monthlyComplaints.length;

  const monthlyResolved = monthlyComplaints.filter(
    (c) => c.status === "Resolved"
  ).length;

  const monthlyPending = monthlyComplaints.filter(
    (c) => c.status === "Pending"
  ).length;

  const monthlyAssigned = monthlyComplaints.filter(
    (c) => c.status === "Assigned"
  ).length;

  const monthlyInProgress = monthlyComplaints.filter(
    (c) => c.status === "In Progress"
  ).length;

  const activeComplaints =
    monthlyPending + monthlyAssigned + monthlyInProgress;

  const currentMonthName = now.toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const formatDate = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "—";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return [22, 101, 52];

      case "In Progress":
        return [109, 40, 217];

      case "Assigned":
        return [194, 65, 12];

      case "Pending":
        return [30, 64, 175];

      default:
        return [71, 85, 105];
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return [185, 28, 28];

      case "Medium":
        return [180, 83, 9];

      case "Low":
        return [21, 128, 61];

      default:
        return [71, 85, 105];
    }
  };

  const drawHeader = (doc, pageNumber) => {
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 15, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("MEDI-CAPS UNIVERSITY", 14, 9);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      "CAMPUSFIX  •  CAMPUS MAINTENANCE MANAGEMENT SYSTEM",
      14,
      12.5
    );

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.text(`Page ${pageNumber}`, pageWidth - 14, 10, {
      align: "right",
    });
  };

  const drawFooter = (doc) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(226, 232, 240);
    doc.line(14, pageHeight - 12, pageWidth - 14, pageHeight - 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.text(
      "Official CampusFix Administration Report",
      14,
      pageHeight - 6
    );

    doc.text(
      "Generated automatically",
      pageWidth - 14,
      pageHeight - 6,
      {
        align: "right",
      }
    );
  };

  const downloadMonthlyPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    /*
     * ------------------------------------------------
     * PAGE 1 — EXECUTIVE SUMMARY
     * ------------------------------------------------
     */

    drawHeader(doc, 1);

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);

    doc.text("Monthly Maintenance Report", 14, 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);

    doc.text(currentMonthName, 14, 36);

    doc.setFontSize(8);
    doc.text(
      `Generated on ${formatDateTime(now)}`,
      pageWidth - 14,
      36,
      {
        align: "right",
      }
    );

    /*


        /*
     * Report Information
     */

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    doc.roundedRect(14, 44, pageWidth - 28, 22, 3, 3, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);

    doc.text("REPORT TYPE", 20, 51);
    doc.text("REPORTING PERIOD", 78, 51);
    doc.text("TOTAL RECORDS", 150, 51);
    doc.text("RESOLVED", 218, 51);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    doc.text("Monthly Summary", 20, 59);
    doc.text(currentMonthName, 78, 59);
    doc.text(String(monthlyTotal), 150, 59);
    doc.setTextColor(22, 101, 52);
    doc.text(String(monthlyResolved), 218, 59);

    /*
     * KPI CARDS
     */

    const cardY = 73;
    const cardWidth = 59;
    const cardHeight = 30;
    const gap = 5;

    const cards = [
      {
        label: "TOTAL COMPLAINTS",
        value: monthlyTotal,
        color: [30, 41, 59],
      },
      {
        label: "RESOLVED",
        value: monthlyResolved,
        color: [22, 101, 52],
      },
      {
        label: "ACTIVE",
        value: activeComplaints,
        color: [194, 65, 12],
      },
      {
        label: "PENDING",
        value: monthlyPending,
        color: [30, 64, 175],
      },
    ];

    cards.forEach((card, index) => {
      const x = 14 + index * (cardWidth + gap);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "FD");

      doc.setFillColor(...card.color);
      doc.roundedRect(x, cardY, 3, cardHeight, 1.5, 1.5, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);

      doc.text(card.label, x + 9, cardY + 9);

      doc.setFontSize(18);
      doc.setTextColor(...card.color);

      doc.text(String(card.value), x + 9, cardY + 23);
    });

    /*
     * Complaint Overview
     */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);

    doc.text("Complaint Overview", 14, 119);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    const summaryText =
      monthlyTotal === 0
        ? "No complaints were recorded during the selected reporting period."
        : `A total of ${monthlyTotal} complaint${
            monthlyTotal === 1 ? "" : "s"
          } were recorded during ${currentMonthName}. ${monthlyResolved} ${
            monthlyResolved === 1 ? "complaint has" : "complaints have"
          } been resolved, while ${activeComplaints} ${
            activeComplaints === 1 ? "complaint remains" : "complaints remain"
          } under active processing.`;

    const summaryLines = doc.splitTextToSize(
      summaryText,
      pageWidth - 28
    );

    doc.text(summaryLines, 14, 127);

    /*
     * Status Summary
     */

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    doc.text("Status Summary", 14, 145);

    autoTable(doc, {
      startY: 150,
      margin: {
        left: 14,
        right: 14,
      },
      tableWidth: pageWidth - 28,

      head: [
        [
          "Status",
          "Complaints",
          "Share of Monthly Records",
        ],
      ],

      body: [
        [
          "Pending",
          monthlyPending,
          monthlyTotal
            ? `${((monthlyPending / monthlyTotal) * 100).toFixed(1)}%`
            : "0%",
        ],
        [
          "Assigned",
          monthlyAssigned,
          monthlyTotal
            ? `${((monthlyAssigned / monthlyTotal) * 100).toFixed(1)}%`
            : "0%",
        ],
        [
          "In Progress",
          monthlyInProgress,
          monthlyTotal
            ? `${((monthlyInProgress / monthlyTotal) * 100).toFixed(1)}%`
            : "0%",
        ],
        [
          "Resolved",
          monthlyResolved,
          monthlyTotal
            ? `${((monthlyResolved / monthlyTotal) * 100).toFixed(1)}%`
            : "0%",
        ],
      ],

      theme: "plain",

      styles: {
        font: "helvetica",
        fontSize: 8,
        cellPadding: 5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.2,
      },

      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [51, 65, 85],
        fontStyle: "bold",
        fontSize: 7.5,
      },

      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },

      columnStyles: {
        0: {
          cellWidth: 80,
          fontStyle: "bold",
        },
        1: {
          cellWidth: 50,
          halign: "center",
        },
        2: {
          halign: "center",
        },
      },
    });

    /*
     * Category Overview
     */

    const categoryMap = {};

    monthlyComplaints.forEach((complaint) => {
      const category = complaint.category || "Other";

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }

      categoryMap[category]++;
    });

    const categoryRows = Object.entries(categoryMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => [
        category,
        count,
        monthlyTotal
          ? `${((count / monthlyTotal) * 100).toFixed(1)}%`
          : "0%",
      ]);

    if (categoryRows.length > 0) {
      const categoryStart =
        doc.lastAutoTable.finalY + 9;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);

      doc.text("Complaint Categories", 14, categoryStart);

      autoTable(doc, {
        startY: categoryStart + 5,
        margin: {
          left: 14,
          right: 14,
        },

        head: [
          [
            "Category",
            "Complaints",
            "Share",
          ],
        ],

        body: categoryRows,

        theme: "plain",

        styles: {
          font: "helvetica",
          fontSize: 8,
          cellPadding: 4,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.2,
        },

        headStyles: {
          fillColor: [241, 245, 249],
          textColor: [51, 65, 85],
          fontStyle: "bold",
          fontSize: 7.5,
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: {
          0: {
            cellWidth: 100,
            fontStyle: "bold",
          },
          1: {
            cellWidth: 55,
            halign: "center",
          },
          2: {
            halign: "center",
          },
        },
      });
    }

    drawFooter(doc);

        /*
     * ------------------------------------------------
     * PAGE 2 — DETAILED COMPLAINT REGISTER
     * ------------------------------------------------
     */

    doc.addPage();

    drawHeader(doc, 2);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(15, 23, 42);

    doc.text("Detailed Complaint Register", 14, 29);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);

    doc.text(
      `${monthlyTotal} complaint${
        monthlyTotal === 1 ? "" : "s"
      } recorded during ${currentMonthName}`,
      14,
      35
    );

    /*
     * Detailed Table
     */

    if (monthlyComplaints.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);

      doc.roundedRect(
        14,
        50,
        pageWidth - 28,
        35,
        3,
        3,
        "FD"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105);

      doc.text(
        "No complaints found for this reporting period.",
        pageWidth / 2,
        69,
        {
          align: "center",
        }
      );
    } else {
      const tableData = monthlyComplaints.map(
        (complaint, index) => [
          index + 1,
          complaint.category || "—",
          `${complaint.block || "—"}${
            complaint.room
              ? ` / Room ${complaint.room}`
              : ""
          }`,
          complaint.user?.name || "—",
          complaint.status || "—",
          complaint.priority || "—",
          formatDate(complaint.createdAt),
          formatDate(complaint.assignedAt),
          formatDate(complaint.resolvedAt),
        ]
      );

      autoTable(doc, {
        startY: 43,

        margin: {
          top: 22,
          left: 10,
          right: 10,
          bottom: 18,
        },

        head: [
          [
            "#",
            "Category",
            "Location",
            "Reported By",
            "Status",
            "Priority",
            "Raised",
            "Assigned",
            "Resolved",
          ],
        ],

        body: tableData,

        theme: "grid",

        styles: {
          font: "helvetica",
          fontSize: 7,
          cellPadding: 3.5,
          valign: "middle",
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.15,
        },

        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          fontSize: 7,
          halign: "center",
          cellPadding: 4,
        },

        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },

        columnStyles: {
          0: {
            cellWidth: 9,
            halign: "center",
          },

          1: {
            cellWidth: 25,
            fontStyle: "bold",
          },

          2: {
            cellWidth: 39,
          },

          3: {
            cellWidth: 35,
          },

          4: {
            cellWidth: 29,
            halign: "center",
          },

          5: {
            cellWidth: 22,
            halign: "center",
          },

          6: {
            cellWidth: 26,
            halign: "center",
          },

          7: {
            cellWidth: 26,
            halign: "center",
          },

          8: {
            cellWidth: 26,
            halign: "center",
          },
        },

        didParseCell: (data) => {
          if (data.section !== "body") return;

          const column = data.column.index;
          const value = data.cell.raw;

          /*
           * Status
           */

          if (column === 4) {
            const color = getStatusColor(value);

            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = "bold";
          }

          /*
           * Priority
           */

          if (column === 5) {
            const color = getPriorityColor(value);

            data.cell.styles.textColor = color;
            data.cell.styles.fontStyle = "bold";
          }

          /*
           * Serial Number
           */

          if (column === 0) {
            data.cell.styles.textColor = [100, 116, 139];
          }
        },

        didDrawPage: (data) => {
          const pageNumber =
            doc.internal.getNumberOfPages();

          drawHeader(doc, pageNumber);
          drawFooter(doc);
        },
      });
    }

    /*
     * ------------------------------------------------
     * REPORT NOTE
     * ------------------------------------------------
     */

    let finalY = doc.lastAutoTable
      ? doc.lastAutoTable.finalY
      : 90;

    /*
     * If the table is very long, place the note on
     * the last page with enough spacing.
     */

    if (finalY > pageHeight - 35) {
      doc.addPage();

      const newPageNumber =
        doc.internal.getNumberOfPages();

      drawHeader(doc, newPageNumber);

      finalY = 35;
    }

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);

    doc.roundedRect(
      14,
      finalY + 10,
      pageWidth - 28,
      20,
      3,
      3,
      "FD"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(71, 85, 105);

    doc.text("REPORT NOTE", 20, finalY + 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);

    doc.text(
      "This report contains complaint records generated through the CampusFix campus maintenance system.",
      20,
      finalY + 24
    );

    drawFooter(doc);

    /*
     * ------------------------------------------------
     * SAVE PDF
     * ------------------------------------------------
     */

    const safeMonthName = currentMonthName
      .replace(/\s+/g, "_")
      .replace(/,/g, "");

    doc.save(
      `CampusFix_Monthly_Maintenance_Report_${safeMonthName}.pdf`
    );
  };

    const pageBg = darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-800";
  const panelBg = darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const mutedText = darkMode ? "text-slate-400" : "text-slate-500";
  const headingText = darkMode ? "text-white" : "text-slate-900";
  const tableBorder = darkMode ? "border-slate-800" : "border-slate-100";
  const tableCellText = darkMode ? "text-slate-300" : "text-slate-600";

  const statCards = [
    { label: "Total complaints", value: monthlyTotal, accent: "indigo", icon: "▤", note: "Reported this month" },
    { label: "Resolved", value: monthlyResolved, accent: "emerald", icon: "✓", note: "Successfully closed" },
    { label: "Pending", value: monthlyPending, accent: "blue", icon: "◷", note: "Awaiting action" },
    { label: "Assigned", value: monthlyAssigned, accent: "orange", icon: "↗", note: "Assigned to staff" },
    { label: "In progress", value: monthlyInProgress, accent: "purple", icon: "⟳", note: "Currently being handled" },
  ];

  const accentStyles = {
    indigo: darkMode ? "bg-indigo-500/10 text-indigo-300 ring-indigo-400/20" : "bg-indigo-50 text-indigo-700 ring-indigo-100",
    emerald: darkMode ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" : "bg-emerald-50 text-emerald-700 ring-emerald-100",
    blue: darkMode ? "bg-blue-500/10 text-blue-300 ring-blue-400/20" : "bg-blue-50 text-blue-700 ring-blue-100",
    orange: darkMode ? "bg-orange-500/10 text-orange-300 ring-orange-400/20" : "bg-orange-50 text-orange-700 ring-orange-100",
    purple: darkMode ? "bg-purple-500/10 text-purple-300 ring-purple-400/20" : "bg-purple-50 text-purple-700 ring-purple-100",
  };

  const statusStyles = {
    Resolved: darkMode ? "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20" : "bg-emerald-50 text-emerald-700 ring-emerald-100",
    "In Progress": darkMode ? "bg-purple-500/10 text-purple-300 ring-purple-400/20" : "bg-purple-50 text-purple-700 ring-purple-100",
    Assigned: darkMode ? "bg-orange-500/10 text-orange-300 ring-orange-400/20" : "bg-orange-50 text-orange-700 ring-orange-100",
    Pending: darkMode ? "bg-blue-500/10 text-blue-300 ring-blue-400/20" : "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${pageBg}`}>
      <AdminSidebar onLogout={() => setShowLogout(true)} />

      <div className="min-h-screen lg:ml-64">
        <header className={`sticky top-0 z-20 border-b px-5 py-5 backdrop-blur-xl sm:px-8 ${
          darkMode ? "border-slate-800 bg-slate-950/90" : "border-slate-200 bg-white/90"
        }`}>
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className={`mb-1 text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                CampusFix · Administration
              </div>
              <h1 className={`text-2xl font-black tracking-tight sm:text-3xl ${headingText}`}>
                Monthly Reports
              </h1>
              <p className={`mt-1 text-sm ${mutedText}`}>
                Maintenance activity and complaint performance for {currentMonthName}
              </p>
            </div>
            <div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${
              darkMode ? "border-slate-700 bg-slate-900 text-slate-300" : "border-slate-200 bg-slate-50 text-slate-600"
            }`}>
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Current reporting period
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">
          <section className={`relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8 ${panelBg}`}>
            <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className={`text-xs font-bold uppercase tracking-[0.18em] ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                  Monthly overview
                </p>
                <h2 className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl ${headingText}`}>
                  {currentMonthName}
                </h2>
                <p className={`mt-2 max-w-2xl text-sm leading-6 ${mutedText}`}>
                  Review the month’s complaint activity, monitor resolution progress, and export an official university administration report.
                </p>
                <div className={`mt-5 flex flex-wrap gap-4 text-xs font-medium ${mutedText}`}>
                  <span>● {monthlyTotal} total records</span>
                  <span>● {monthlyResolved} resolved</span>
                  <span>● {activeComplaints} active cases</span>
                </div>
              </div>
              <button
                onClick={downloadMonthlyPDF}
                className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30"
              >
                <span className="text-lg">↓</span>
                Download official PDF
              </button>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className={`text-lg font-extrabold ${headingText}`}>Performance snapshot</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>Key complaint indicators for this month</p>
              </div>
              <span className={`hidden rounded-lg px-3 py-1.5 text-xs font-semibold sm:inline-flex ${
                darkMode ? "bg-slate-900 text-slate-400" : "bg-white text-slate-500 shadow-sm"
              }`}>Live summary</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {statCards.map((card) => (
                <article key={card.label} className={`group rounded-2xl border p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg ${panelBg}`}>
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-xs font-bold uppercase tracking-wider ${mutedText}`}>{card.label}</p>
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ring-1 ${accentStyles[card.accent]}`}>
                      {card.icon}
                    </span>
                  </div>
                  <p className={`mt-5 text-3xl font-black tracking-tight ${headingText}`}>{card.value}</p>
                  <p className={`mt-1 text-xs ${mutedText}`}>{card.note}</p>
                </article>
              ))}
            </div>
          </section>

          <section className={`overflow-hidden rounded-3xl border shadow-sm ${panelBg}`}>
            <div className={`flex flex-col justify-between gap-3 border-b px-6 py-5 sm:flex-row sm:items-center ${tableBorder}`}>
              <div>
                <h2 className={`text-lg font-extrabold ${headingText}`}>Monthly complaints register</h2>
                <p className={`mt-1 text-sm ${mutedText}`}>
                  {monthlyComplaints.length} {monthlyComplaints.length === 1 ? "complaint" : "complaints"} created during {currentMonthName}
                </p>
              </div>
              <div className={`w-fit rounded-xl px-3 py-2 text-xs font-bold ${darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                {currentMonthName}
              </div>
            </div>

            {monthlyComplaints.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-400"}`}>▤</div>
                <h3 className={`mt-4 font-bold ${headingText}`}>No complaints this month</h3>
                <p className={`mt-1 text-sm ${mutedText}`}>There are no complaint records for the current reporting period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left">
                  <thead className={darkMode ? "bg-slate-800/70" : "bg-slate-50"}>
                    <tr className={`border-b text-[11px] uppercase tracking-wider ${tableBorder} ${mutedText}`}>
                      <th className="px-6 py-4 font-bold">Category</th>
                      <th className="px-6 py-4 font-bold">Location</th>
                      <th className="px-6 py-4 font-bold">Reported by</th>
                      <th className="px-6 py-4 font-bold">Status</th>
                      <th className="px-6 py-4 font-bold">Priority</th>
                      <th className="px-6 py-4 font-bold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyComplaints.map((complaint) => (
                      <tr key={complaint._id} className={`border-b transition-colors last:border-0 ${
                        darkMode ? "border-slate-800 hover:bg-slate-800/50" : "border-slate-100 hover:bg-slate-50"
                      }`}>
                        <td className={`px-6 py-4 text-sm font-semibold ${headingText}`}>{complaint.category || "—"}</td>
                        <td className={`px-6 py-4 text-sm ${tableCellText}`}>
                          {complaint.block || "—"}{complaint.room ? ` · Room ${complaint.room}` : ""}
                        </td>
                        <td className={`px-6 py-4 text-sm ${tableCellText}`}>{complaint.user?.name || "—"}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${
                            statusStyles[complaint.status] || (darkMode ? "bg-slate-800 text-slate-300 ring-slate-700" : "bg-slate-100 text-slate-600 ring-slate-200")
                          }`}>
                            {complaint.status || "—"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold ${
                            complaint.priority === "High" ? (darkMode ? "text-red-300" : "text-red-600")
                              : complaint.priority === "Medium" ? (darkMode ? "text-orange-300" : "text-orange-600")
                              : (darkMode ? "text-emerald-300" : "text-emerald-600")
                          }`}>{complaint.priority || "—"}</span>
                        </td>
                        <td className={`whitespace-nowrap px-6 py-4 text-sm ${mutedText}`}>{formatDate(complaint.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className={`border-t px-6 py-3 text-xs ${tableBorder} ${mutedText}`}>
              Official CampusFix monthly administration summary · Medi-Caps University
            </div>
          </section>
        </main>
      </div>

      <LogoutModal
        isOpen={showLogout}
        onClose={() => setShowLogout(false)}
      />
    </div>
  );
}

export default AdminMonthlyReport;