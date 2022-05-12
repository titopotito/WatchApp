const { getTimePassed } = require("../public/js/time-utils");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const chatSchema = new Schema({
    users: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    chatMessages: [
        {
            type: Schema.Types.ObjectId,
            ref: "ChatMessage",
        },
    ],
});

const filterChat = function (chat) {
    if (chat) {
        return {
            _id: chat._id,
            users: chat.users.map((user) => {
                return {
                    username: user.username,
                };
            }),
            chatMessages: chat.chatMessages.map((chatMessage) => {
                return {
                    _id: chatMessage._id,
                    sender: chatMessage.sender.username,
                    textContent: chatMessage.textContent,
                    timePassed: getTimePassed(chatMessage.timeStamp),
                };
            }),
        };
    }
    return null;
};

const filterChatList = function (chatList, user) {
    return chatList.map((chat) => {
        return {
            _id: chat._id,
            chatMates: chat.users.filter(
                (otherUser) => otherUser.username !== user.username
            ),
            lastChatMessage: chat.chatMessages[0].textContent,
            timePassed: getTimePassed(chat.chatMessages[0].timeStamp),
        };
    });
};

chatSchema.static("getChat", async function (chatID) {
    const chat = await Chat.findById(chatID, {
        chatMessages: { $slice: -10 },
    })
        .populate("users")
        .populate("chatMessages")
        .populate({ path: "chatMessages", populate: { path: "sender" } });

    const filteredChatData = filterChat(chat);
    return filteredChatData;
});

chatSchema.static("getChatByUsers", async function (users) {
    const chat = await Chat.findOne({
        users: { $all: users, $size: users.length },
    })
        .populate("users")
        .populate("chatMessages")
        .populate({ path: "chatMessages", populate: { path: "sender" } });

    const filteredChatData = filterChat(chat);
    return filteredChatData;
});

chatSchema.static("getChatList", async function (user) {
    const chatList = await Chat.find(
        {
            users: { $in: [user._id] },
        },
        {
            chatMessages: { $slice: -1 },
        }
    )
        .populate("users")
        .populate("chatMessages");

    const filteredChatListData = filterChatList(chatList, user);
    return filteredChatListData;
});

const Chat = mongoose.model("Chat", chatSchema);

module.exports = Chat;
