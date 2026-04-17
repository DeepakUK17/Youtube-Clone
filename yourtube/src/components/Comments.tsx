"use client";

import React, { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import {
  ThumbsUp,
  ThumbsDown,
  Globe,
  MapPin,
  ChevronDown,
  RotateCcw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface Comment {
  _id: string;
  videoid: string;
  userid: string;
  commentbody: string;
  usercommented: string;
  commentedon: string;
  city: string;
  likes: string[];
  dislikes: string[];
}

// ─── Available languages for translation ────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ta", label: "Tamil" },
  { code: "hi", label: "Hindi" },
  { code: "te", label: "Telugu" },
  { code: "kn", label: "Kannada" },
  { code: "ml", label: "Malayalam" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "es", label: "Spanish" },
  { code: "ja", label: "Japanese" },
  { code: "zh", label: "Chinese" },
  { code: "ar", label: "Arabic" },
  { code: "ru", label: "Russian" },
];

// ─── Special character validation (mirrors server-side rule) ─────────────────
const SPECIAL_CHAR_REGEX = /[^\p{L}\p{N}\p{M}\s.,!?'"()\-]/u;

// ─── Sub-component: Translate Dropdown ───────────────────────────────────────
const TranslateDropdown = ({
  commentId,
  onTranslated,
  isTranslated,
  onReset,
}: {
  commentId: string;
  onTranslated: (text: string) => void;
  isTranslated: boolean;
  onReset: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleTranslate = async (langCode: string) => {
    setOpen(false);
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/comment/translate/${commentId}?lang=${langCode}`
      );
      if (res.data.translated) {
        onTranslated(res.data.translated);
      }
    } catch {
      alert("Translation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isTranslated) {
    return (
      <button
        onClick={onReset}
        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors"
        title="Show original"
      >
        <RotateCcw className="w-3 h-3" />
        Show original
      </button>
    );
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-50"
        title="Translate comment"
      >
        <Globe className="w-3 h-3" />
        {loading ? "Translating..." : "Translate"}
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-36 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleTranslate(lang.code)}
              className="block w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors"
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const Comments = ({ videoId }: { videoId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(true);

  // Track translated text per comment (commentId → translated string)
  const [translations, setTranslations] = useState<Record<string, string>>({});

  const { user } = useUser();

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const loadComments = async () => {
    try {
      const res = await axiosInstance.get(`/comment/${videoId}`);
      setComments(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ── Validate comment text client-side ───────────────────────────────────
  const validateComment = (text: string): boolean => {
    if (!text.trim()) {
      setInputError("Comment cannot be empty.");
      return false;
    }
    if (SPECIAL_CHAR_REGEX.test(text)) {
      setInputError(
        "Special characters (e.g. @#$%^&*) are not allowed in comments."
      );
      return false;
    }
    setInputError("");
    return true;
  };

  // ── Submit new comment ───────────────────────────────────────────────────
  const handleSubmitComment = async () => {
    if (!user) return;
    if (!validateComment(newComment)) return;

    setIsSubmitting(true);
    try {
      const res = await axiosInstance.post("/comment/postcomment", {
        videoid: videoId,
        userid: user._id,
        commentbody: newComment,
        usercommented: user.name,
      });
      if (res.data.comment) {
        // Reload to get server-resolved city
        await loadComments();
        setNewComment("");
      }
    } catch (error: any) {
      const msg = error?.response?.data?.message;
      if (msg) setInputError(msg);
      else console.error("Error adding comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit comment ─────────────────────────────────────────────────────────
  const handleEdit = (comment: Comment) => {
    setEditingCommentId(comment._id);
    setEditText(comment.commentbody);
  };

  const handleUpdateComment = async () => {
    if (!editText.trim()) return;
    try {
      await axiosInstance.post(`/comment/editcomment/${editingCommentId}`, {
        commentbody: editText,
      });
      setComments((prev) =>
        prev.map((c) =>
          c._id === editingCommentId ? { ...c, commentbody: editText } : c
        )
      );
      setEditingCommentId(null);
      setEditText("");
    } catch (error) {
      console.error(error);
    }
  };

  // ── Delete comment ────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await axiosInstance.delete(`/comment/deletecomment/${id}`);
      if (res.data.comment) {
        setComments((prev) => prev.filter((c) => c._id !== id));
      }
    } catch (error) {
      console.error(error);
    }
  };

  // ── Like comment ─────────────────────────────────────────────────────────
  const handleLike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.put(`/comment/like/${commentId}`, {
        userId: user._id,
      });
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== commentId) return c;
          const uid = user._id;
          if (res.data.liked) {
            return {
              ...c,
              likes: [...c.likes.filter((id) => id !== uid), uid],
              dislikes: c.dislikes.filter((id) => id !== uid),
            };
          } else {
            return { ...c, likes: c.likes.filter((id) => id !== uid) };
          }
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ── Dislike comment ──────────────────────────────────────────────────────
  const handleDislike = async (commentId: string) => {
    if (!user) return;
    try {
      const res = await axiosInstance.put(`/comment/dislike/${commentId}`, {
        userId: user._id,
      });
      if (res.data.deleted) {
        // Auto-removed by server (2 dislikes reached)
        setComments((prev) => prev.filter((c) => c._id !== commentId));
        return;
      }
      setComments((prev) =>
        prev.map((c) => {
          if (c._id !== commentId) return c;
          const uid = user._id;
          if (res.data.disliked) {
            return {
              ...c,
              dislikes: [...c.dislikes.filter((id) => id !== uid), uid],
              likes: c.likes.filter((id) => id !== uid),
            };
          } else {
            return { ...c, dislikes: c.dislikes.filter((id) => id !== uid) };
          }
        })
      );
    } catch (error) {
      console.error(error);
    }
  };

  // ── Translation handlers ──────────────────────────────────────────────────
  const handleTranslated = (commentId: string, text: string) => {
    setTranslations((prev) => ({ ...prev, [commentId]: text }));
  };

  const handleResetTranslation = (commentId: string) => {
    setTranslations((prev) => {
      const updated = { ...prev };
      delete updated[commentId];
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        Loading comments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">{comments.length} Comments</h2>

      {/* ── New comment input ── */}
      {user ? (
        <div className="flex gap-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.image || ""} />
            <AvatarFallback>{user.name?.[0] || "U"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder="Add a comment... (No special characters)"
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setNewComment(e.target.value);
                if (inputError) validateComment(e.target.value);
              }}
              className="min-h-[80px] resize-none border-0 border-b-2 rounded-none focus-visible:ring-0"
            />
            {/* Validation error */}
            {inputError && (
              <p className="text-xs text-red-500">{inputError}</p>
            )}
            <div className="flex gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => {
                  setNewComment("");
                  setInputError("");
                }}
                disabled={!newComment.trim()}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || isSubmitting}
              >
                {isSubmitting ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Sign in to leave a comment.</p>
      )}

      {/* ── Comment list ── */}
      <div className="space-y-5">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => {
            const isOwner = comment.userid === user?._id;
            const userLiked = user && comment.likes.includes(user._id);
            const userDisliked = user && comment.dislikes.includes(user._id);
            const translatedText = translations[comment._id];

            return (
              <div key={comment._id} className="flex gap-4">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src="/placeholder.svg?height=40&width=40" />
                  <AvatarFallback>
                    {comment.usercommented?.[0] || "?"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* ── Header row: name · time · city ── */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-sm">
                      {comment.usercommented}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(comment.commentedon))} ago
                    </span>
                    {/* City badge */}
                    {comment.city && comment.city !== "Unknown" && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                        <MapPin className="w-3 h-3" />
                        {comment.city}
                      </span>
                    )}
                  </div>

                  {/* ── Edit mode ── */}
                  {editingCommentId === comment._id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={handleUpdateComment}
                          disabled={!editText.trim()}
                          size="sm"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── Comment body (or translated) ── */}
                      <p className="text-sm leading-relaxed">
                        {translatedText || comment.commentbody}
                      </p>
                      {translatedText && (
                        <p className="text-xs text-gray-400 mt-0.5 italic">
                          (Translated)
                        </p>
                      )}

                      {/* ── Action row: like · dislike · translate · edit/delete ── */}
                      <div className="flex flex-wrap items-center gap-3 mt-2">
                        {/* Like */}
                        <button
                          onClick={() => handleLike(comment._id)}
                          disabled={!user}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            userLiked
                              ? "text-blue-600"
                              : "text-gray-500 hover:text-gray-700"
                          } disabled:opacity-40`}
                          title="Like"
                        >
                          <ThumbsUp
                            className={`w-4 h-4 ${userLiked ? "fill-blue-600" : ""}`}
                          />
                          {comment.likes.length > 0 && comment.likes.length}
                        </button>

                        {/* Dislike */}
                        <button
                          onClick={() => handleDislike(comment._id)}
                          disabled={!user}
                          className={`flex items-center gap-1 text-xs transition-colors ${
                            userDisliked
                              ? "text-red-500"
                              : "text-gray-500 hover:text-gray-700"
                          } disabled:opacity-40`}
                          title={`Dislike${comment.dislikes.length > 0 ? ` (${comment.dislikes.length}/2 — auto-removes at 2)` : ""}`}
                        >
                          <ThumbsDown
                            className={`w-4 h-4 ${userDisliked ? "fill-red-500" : ""}`}
                          />
                          {comment.dislikes.length > 0 &&
                            comment.dislikes.length}
                        </button>

                        {/* Translate */}
                        <TranslateDropdown
                          commentId={comment._id}
                          isTranslated={!!translatedText}
                          onTranslated={(text) =>
                            handleTranslated(comment._id, text)
                          }
                          onReset={() => handleResetTranslation(comment._id)}
                        />

                        {/* Edit / Delete (own comments only) */}
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleEdit(comment)}
                              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(comment._id)}
                              className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Comments;
