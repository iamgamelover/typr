Members = Members or {}
Posts = Posts or {}
Replies = Replies or {}

-- Handlers.add(
--   "Register",
--   Handlers.utils.hasMatchingTag("Action", "Register"),
--   function(msg)
--     table.insert(Members, msg.From)
--     Handlers.utils.reply("registered")(msg)
--   end
-- )

Handlers.add(
  "GetPosts",
  Handlers.utils.hasMatchingTag("Action", "GetPosts"),
  function(msg)
    Handlers.utils.reply(table.concat(Posts, "▲"))(msg)
  end
)

Handlers.add(
  "SendPost",
  Handlers.utils.hasMatchingTag("Action", "SendPost"),
  function(msg)
    table.insert(Posts, msg.Data)
  end
)

Handlers.add(
  "GetReplies",
  Handlers.utils.hasMatchingTag("Action", "GetReplies"),
  function(msg)
    Handlers.utils.reply(table.concat(Replies, "▲"))(msg)
  end
)

Handlers.add(
  "SendReply",
  Handlers.utils.hasMatchingTag("Action", "SendReply"),
  function(msg)
    table.insert(Replies, msg.Data)
  end
)
