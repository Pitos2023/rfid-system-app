"use client";

import { useState, useEffect } from "react";
import { createScopedClient } from "../supabaseClient";
import { fetchLeaveNotifications } from "./utils";
import { Download, Eye, FileText, Calendar, User, Mail } from "lucide-react";

export default function LeaveNotifications() {
  const [leaveNotifications, setLeaveNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [attachmentModal, setAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const ITEMS_PER_PAGE = 10;

  const role = sessionStorage.getItem("role") || "guard";
  const supabase = createScopedClient(role);

  // Fetch leave notifications
  const fetchLeaves = async (page = 1) => {
    try {
      setLoading(true);
      const { leaveNotifications: data, totalPages, totalCount } = await fetchLeaveNotifications(page, ITEMS_PER_PAGE);
      
      setLeaveNotifications(data);
      setTotalPages(totalPages);
      setTotalCount(totalCount);
    } catch (error) {
      console.error("❌ Error fetching leave notifications:", error);
      setLeaveNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves(currentPage);
  }, [currentPage]);

  // Handle file download
  const handleDownloadAttachment = async (fileName) => {
    if (!fileName) {
      alert("No attachment available");
      return;
    }
    try {
      const { data, error } = await supabase.storage
        .from("leave-attachments")
        .download(fileName);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = fileName;
      downloadLink.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("❌ Download error:", err);
      alert("❌ Failed to download file");
    }
  };

  // Handle file view
  const handleViewAttachment = async (fileName) => {
    if (!fileName) {
      alert("No attachment available");
      return;
    }
    try {
      const { data } = supabase.storage
        .from("leave-attachments")
        .getPublicUrl(fileName);

      setSelectedAttachment(data.publicUrl);
      setAttachmentModal(true);
    } catch (err) {
      console.error("❌ View attachment error:", err);
      alert("❌ Failed to load file");
    }
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Previous
        </button>

        <span className="text-gray-700 font-medium">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#660000] disabled:bg-gray-400 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading leave notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-[#800000]">
        <h2 className="text-2xl font-bold text-[#800000] mb-2">
          Leave Notifications
        </h2>
        <p className="text-gray-600">
          View all student leave requests and approvals. Total: {totalCount} leave notices
        </p>
      </div>

      {/* Leave Notifications List */}
      <div className="space-y-4">
        {leaveNotifications.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-[#800000]">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Leave Notifications
            </h3>
            <p className="text-gray-500">
              There are no leave notifications at the moment.
            </p>
          </div>
        ) : (
          leaveNotifications.map((notification) => (
            <div
              key={notification.id}
              className="bg-white rounded-2xl shadow-lg p-6 border border-[#800000] hover:shadow-xl transition-shadow duration-200"
            >
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-[#800000]">
                    {notification.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                  Leave Notice
                </span>
              </div>

              {/* Parent Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {notification.parentName}
                    </p>
                    <p className="text-xs text-gray-500">Parent</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-900">
                      {notification.parentEmail}
                    </p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
              </div>

              {/* Leave Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {notification.date}
                    </p>
                    <p className="text-xs text-gray-500">Submitted</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-gray-900">Reason:</span>{" "}
                    <span className="text-blue-600">{notification.reason}</span>
                  </p>
                </div>
              </div>

              {/* Signature and Attachment */}
              <div className="border-t pt-4 space-y-3">
                {notification.signature && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      E-Signature:
                    </p>
                    <img
                      src={notification.signature}
                      alt="Signature"
                      className="h-16 border border-gray-300 rounded-lg"
                    />
                  </div>
                )}

                {notification.attachment && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">
                      Attachment:
                    </p>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {notification.attachment}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewAttachment(notification.attachment)}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(notification.attachment)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition"
                        >
                          <Download size={14} />
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Attachment Modal */}
      {attachmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-96 overflow-auto">
            <div className="flex justify-between items-center p-4 border-b border-[#800000]">
              <h3 className="text-lg font-bold text-[#800000]">
                Document Preview
              </h3>
              <button
                onClick={() => {
                  setAttachmentModal(false);
                  setSelectedAttachment(null);
                }}
                className="p-1 hover:bg-gray-200 rounded transition"
              >
                <X size={20} color="#800000" />
              </button>
            </div>
            <div className="p-6">
              {selectedAttachment && (
                <>
                  {selectedAttachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <img
                      src={selectedAttachment}
                      alt="Attachment Preview"
                      className="w-full rounded-lg border border-[#800000]"
                    />
                  ) : selectedAttachment.match(/\.(pdf)$/i) ? (
                    <iframe
                      src={selectedAttachment}
                      className="w-full h-96 rounded-lg border border-[#800000]"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="text-center p-6 bg-gray-100 rounded-lg">
                      <FileText size={48} color="#800000" className="mx-auto mb-2" />
                      <p className="text-gray-700 mb-4">
                        Preview not available for this file type
                      </p>
                      <button
                        onClick={() => handleDownloadAttachment(selectedAttachment.split('/').pop())}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#660000] transition mx-auto"
                      >
                        <Download size={16} />
                        Download File
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}