/**
 * Task 1 — Comment Filter Middleware
 * Blocks comments that contain special characters.
 * Allows: Unicode letters (any language), digits, whitespace,
 *         and common punctuation: . , ! ? ' " ( ) -
 */

// Matches any character that is NOT:
//  \p{L}  → any Unicode letter (covers all languages: English, Tamil, Hindi, etc.)
//  \p{N}  → any Unicode number
//  \s     → whitespace
//  .,!?'"()- → common punctuation
const SPECIAL_CHAR_REGEX = /[^\p{L}\p{N}\p{M}\s.,!?'"()\-]/u;

export const filterComment = (req, res, next) => {
  const { commentbody } = req.body;

  if (!commentbody || !commentbody.trim()) {
    return res.status(400).json({ message: "Comment cannot be empty" });
  }

  if (SPECIAL_CHAR_REGEX.test(commentbody)) {
    return res.status(400).json({
      message:
        "Special characters (e.g. @#$%^&*) are not allowed in comments.",
    });
  }

  next();
};
