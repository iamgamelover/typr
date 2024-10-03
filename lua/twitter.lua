Members = Members or {}
Posts = Posts or {}
Replies = Replies or {}

-- Handlers.add(
--   "Register",
--   {Action = "Register"},
--   function(msg)
--     table.insert(Members, msg.From)
--     Handlers.utils.reply({Data = "registered")(msg)
--   end
-- )

Handlers.add(
  "GetPosts",
  {Action = "GetPosts"},
  function(msg)
    msg.reply({Data = table.concat(Posts, "▲")})
    print('server: replied to' .. msg.Data)
  end
)

Handlers.add(
  "SendPost",
  {Action = "SendPost"},
  function(msg)
    table.insert(Posts, msg.Data)
  end
)

Handlers.add(
  "GetReplies",
  {Action = "GetReplies"},
  function(msg)
    msg.reply({Data = table.concat(Replies, "▲")})
  end
)

Handlers.add(
  "SendReply",
  {Action = "SendReply"},
  function(msg)
    table.insert(Replies, msg.Data)
  end
)
