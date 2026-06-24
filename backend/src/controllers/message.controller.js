import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import groq from "../lib/groq.js"; 

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const filteredUsers = await User.find({ 
      _id: { $ne: loggedInUserId } 
    }).select("-password");

    res.status(200).json(filteredUsers);
    
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Save user's message
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });
    await newMessage.save();

    // Emit user's message to receiver
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);

    const isDirectAiChat = receiverId.toString() === process.env.AI_USER_ID;
    const isMentioningAi = text && text.trim().toLowerCase().startsWith("@ai");

    if (isDirectAiChat || isMentioningAi) {
      await handleAiReply({ text, senderId, receiverId });
    }

  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};



async function handleAiReply({ text, senderId, receiverId }) {
  try {
    const aiUserId = process.env.AI_USER_ID;

    // Get last 10 messages between these two users for context
    const recentMessages = await Message.find({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Reverse so oldest is first (chronological order for AI)
    recentMessages.reverse();

    // Build conversation context for Groq
    const conversationHistory = recentMessages
      .filter((msg) => msg.text) // skip image-only messages
      .map((msg) => ({
        role: msg.senderId.toString() === senderId.toString() ? "user" : "assistant",
        content: msg.text,
      }));

    // Strip @ai from the message so AI sees clean question
    const cleanQuestion = text.replace(/@ai/i, "").trim();

    // If the last message isn't the current one, push it
    const lastMsg = conversationHistory[conversationHistory.length - 1];
    if (!lastMsg || lastMsg.content !== cleanQuestion) {
      conversationHistory.push({
        role: "user",
        content: cleanQuestion,
      });
    }

    // Call Groq
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are a helpful AI assistant inside a chat app. 
          Be concise, friendly, and clear. 
          Format responses with line breaks for readability.
          If asked about code, use proper formatting.`,
        },
        ...conversationHistory,
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const aiText = completion.choices[0]?.message?.content;

    if (!aiText) return;

    // Save AI response as a message FROM AI TO the user who asked
    const aiMessage = new Message({
      senderId: aiUserId,     // AI is the sender
      receiverId: senderId,   // original user is receiver
      text: aiText,
    });
    await aiMessage.save();

    // Emit AI message to the user who asked
    const askerSocketId = getReceiverSocketId(senderId.toString());
    if (askerSocketId) {
      io.to(askerSocketId).emit("newMessage", aiMessage);
    }

    // Also emit to the other person in chat so they see the AI reply too
    const receiverSocketId = getReceiverSocketId(receiverId.toString());
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", aiMessage);
    }

  } catch (error) {
    console.error("Error in AI reply handler:", error.message);
  }
}