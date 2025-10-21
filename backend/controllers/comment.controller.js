import { Comment } from "../model/Comment.js";
import { Post } from "../model/Post.js";

// Add Comment
export const addComment = async (req, res) => {
  try {
    const { text, postId } = req.body;
    const userId = req.user.id;

    const comment = new Comment({
      text,
      postId,
      author: userId,
    });

    await comment.save();
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Not authorized" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ msg: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Like Comment
export const likeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params; // commentId

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (comment.likes.includes(userId)) {
      return res.status(400).json({ msg: "Already liked" });
    }

    comment.likes.push(userId);
    await comment.save();

    res.json({ msg: "Comment liked", likes: comment.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unlike Comment
export const unlikeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ msg: "Comment not found" });

    if (!comment.likes.includes(userId)) {
      return res.status(400).json({ msg: "You haven't liked this comment" });
    }

    comment.likes = comment.likes.filter((uid) => uid.toString() !== userId);
    await comment.save();

    res.json({ msg: "Comment unliked", likes: comment.likes.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
