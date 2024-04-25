local json    = require("json")
local sqlite3 = require("lsqlite3")

DB            = DB or sqlite3.open_memory()

DB:exec [[
  CREATE TABLE IF NOT EXISTS users (
    address TEXT PRIMARY KEY,
    avatar TEXT,
    banner TEXT,
    nickname TEXT,
    bio TEXT,
    time INT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    address TEXT,
    post TEXT,
    range TEXT,
    likes INT,
    replies INT,
    coins INT,
    time INT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS replies (
    id TEXT PRIMARY KEY,
    post_id TEXT,
    address TEXT,
    post TEXT,
    likes INT,
    replies INT,
    coins INT,
    time INT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS likes (
    id TEXT,
    address TEXT,
    time INT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS txids (
    id TEXT PRIMARY KEY,
    txid TEXT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS follows (
    following TEXT,
    follower TEXT,
    time INT
  );
]]

DB:exec [[
  CREATE TABLE IF NOT EXISTS messages (
    address TEXT,
    friend TEXT,
    message TEXT,
    time INT
  );
]]

local function query(stmt)
  local rows = {}
  for row in stmt:nrows() do
    table.insert(rows, row)
  end
  stmt:reset()
  return rows
end

Handlers.add(
  "SendMessage",
  Handlers.utils.hasMatchingTag("Action", "SendMessage"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO messages (address, friend, message, time)
      VALUES (:address, :friend, :message, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      address = data.address,
      friend = data.friend,
      message = data.message,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('SendMessage Done!')
  end
)

Handlers.add(
  "GetMessages",
  Handlers.utils.hasMatchingTag("Action", "GetMessages"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT * FROM messages
      WHERE (address = :address AND friend = :friend) OR (address = :friend AND friend = :address);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      friend = data.friend,
      address = data.address,
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "Register",
  Handlers.utils.hasMatchingTag("Action", "Register"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO users (address, avatar, banner, nickname, bio, time)
      VALUES (:address, :avatar, :banner, :nickname, :bio, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      address = data.address,
      avatar = data.avatar,
      banner = data.banner,
      nickname = data.nickname,
      bio = data.bio,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('Register Done!')
  end
)

Handlers.add(
  "GetProfile",
  Handlers.utils.hasMatchingTag("Action", "GetProfile"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT * FROM users WHERE address = :address;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      address = data.address
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "SendTxid",
  Handlers.utils.hasMatchingTag("Action", "SendTxid"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO txids (id, txid)
      VALUES (:id, :txid);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      txid = data.txid
    })

    stmt:step()
    stmt:reset()
    print('SendTxid Done!')
  end
)

Handlers.add(
  "GetTxid",
  Handlers.utils.hasMatchingTag("Action", "GetTxid"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT txid FROM txids WHERE id = :id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "GetPosts",
  Handlers.utils.hasMatchingTag("Action", "GetPosts"),
  function(msg)
    local data = json.decode(msg.Data)

    local offset    = data.offset
    local id        = data.id
    local address   = data.address

    local stmt_all  = [[
      SELECT p.*, u.avatar, u.nickname
      FROM posts p
      JOIN users u ON p.address = u.address
      ORDER BY p.time DESC LIMIT 10 OFFSET :offset;
    ]]

    local stmt_one  = [[
      SELECT p.*, u.avatar, u.nickname
      FROM posts p
      JOIN users u ON p.address = u.address
      WHERE p.id = :id;
    ]]

    local stmt_addr = [[
      SELECT p.*, u.avatar, u.nickname
      FROM posts p
      JOIN users u ON p.address = u.address
      WHERE p.address = :address
      ORDER BY p.time DESC LIMIT 10 OFFSET :offset;
    ]]

    local stmt
    if id ~= nil then
      stmt = DB:prepare(stmt_one)
    elseif address ~= nil then
      stmt = DB:prepare(stmt_addr)
    else
      stmt = DB:prepare(stmt_all)
    end

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = id,
      offset = offset,
      address = address,
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "SendPost",
  Handlers.utils.hasMatchingTag("Action", "SendPost"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO posts (id, address, post, range, likes, replies, coins, time)
      VALUES (:id, :address, :post, :range, :likes, :replies, :coins, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      address = data.address,
      post = data.post,
      range = data.range,
      likes = data.likes,
      replies = data.replies,
      coins = data.coins,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('SendPost Done!')
  end
)

Handlers.add(
  "GetReplies",
  Handlers.utils.hasMatchingTag("Action", "GetReplies"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT r.*, u.avatar, u.nickname
      FROM replies r
      JOIN users u ON r.address = u.address
      WHERE r.post_id = :post_id
      ORDER BY r.time DESC LIMIT 10000 OFFSET :offset;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      post_id = data.post_id,
      offset = data.offset
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "SendReply",
  Handlers.utils.hasMatchingTag("Action", "SendReply"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO replies (id, post_id, address, post, likes, replies, coins, time)
      VALUES (:id, :post_id, :address, :post, :likes, :replies, :coins, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      post_id = data.post_id,
      address = data.address,
      post = data.post,
      likes = data.likes,
      replies = data.replies,
      coins = data.coins,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('Reply Done!')
  end
)

Handlers.add(
  "UpdateReply",
  Handlers.utils.hasMatchingTag("Action", "UpdateReply"),
  function(msg)
    local id = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE posts SET replies = replies + 1 WHERE id = :id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({ id = id })

    stmt:step()
    stmt:reset()
    print('UpdateReply Done!!')
  end
)

Handlers.add(
  "UpdateBounty",
  Handlers.utils.hasMatchingTag("Action", "UpdateBounty"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE posts SET coins = coins + :coins WHERE id = :id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      coins = tonumber(data.coins)
    })

    stmt:step()
    stmt:reset()
    print('UpdateBounty Done!!')
  end
)

Handlers.add(
  "Follow",
  Handlers.utils.hasMatchingTag("Action", "Follow"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO follows (following, follower, time)
      VALUES (:following, :follower, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      following = data.following,
      follower  = data.follower,
      time      = data.time
    })

    stmt:step()
    stmt:reset()
    print('Follow Done!')
  end
)

Handlers.add(
  "Unfollow",
  Handlers.utils.hasMatchingTag("Action", "Unfollow"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      DELETE FROM follows WHERE following = :following AND follower = :follower;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      following = data.following,
      follower  = data.follower,
    })

    stmt:step()
    stmt:reset()
    print('Unfollow Done!')
  end
)

Handlers.add(
  "GetFollowing",
  Handlers.utils.hasMatchingTag("Action", "GetFollowing"),
  function(msg)
    local data = json.decode(msg.Data)

    local sql_all = [[
      SELECT f.following AS address, u.avatar, u.nickname, u.bio
      FROM follows f
      JOIN users u ON f.following = u.address
      WHERE f.follower = :follower
      ORDER BY f.time DESC LIMIT 10 OFFSET :offset;
    ]]

    local sql_one = [[
      SELECT * FROM follows
      WHERE follower = :follower AND following = :following
    ]]

    local stmt
    if data.follower ~= nil then
      stmt = DB:prepare(sql_all)
    else
      stmt = DB:prepare(sql_one)
    end

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      follower = data.follower,
      following = data.following,
      offset = data.offset
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "GetFollowers",
  Handlers.utils.hasMatchingTag("Action", "GetFollowers"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT f.follower AS address, u.avatar, u.nickname, u.bio
      FROM follows f
      JOIN users u ON f.follower = u.address
      WHERE f.following = :following
      ORDER BY f.time DESC LIMIT 10 OFFSET :offset;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      following = data.following,
      offset = data.offset
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "TempGetFollowsTable",
  Handlers.utils.hasMatchingTag("Action", "TempGetFollowsTable"),
  function(msg)
    local stmt = DB:prepare [[
      SELECT * FROM follows
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "SendLike",
  Handlers.utils.hasMatchingTag("Action", "SendLike"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      REPLACE INTO likes (id, address, time)
      VALUES (:id, :address, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      address = data.address,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('SendLike Done!!')
  end
)

Handlers.add(
  "GetLike",
  Handlers.utils.hasMatchingTag("Action", "GetLike"),
  function(msg)
    local data = json.decode(msg.Data)
    print(data)

    local stmt = DB:prepare [[
      SELECT id FROM likes WHERE id = :id AND address = :address;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      address = data.address
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "UpdateLike",
  Handlers.utils.hasMatchingTag("Action", "UpdateLike"),
  function(msg)
    local id = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE posts SET likes = likes + 1 WHERE id = :id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({ id = id })

    stmt:step()
    stmt:reset()
    print('UpdateLike Done!!')
  end
)

Handlers.add(
  "UpdateLikeForReply",
  Handlers.utils.hasMatchingTag("Action", "UpdateLikeForReply"),
  function(msg)
    local id = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE replies SET likes = likes + 1 WHERE id = :id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({ id = id })

    stmt:step()
    stmt:reset()
    print('UpdateLikeForReply Done!!')
  end
)
