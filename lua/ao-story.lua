local json = require("json")
local sqlite3 = require("lsqlite3")

DB = DB or sqlite3.open_memory()

DB:exec [[
  CREATE TABLE IF NOT EXISTS stories (
    id TEXT PRIMARY KEY,
    address TEXT,
    post TEXT,
    range TEXT,
    category TEXT,
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

local function query(stmt)
  local rows = {}
  for row in stmt:nrows() do
    table.insert(rows, row)
  end
  stmt:reset()
  return rows
end

Handlers.add(
  "GetStories",
  Handlers.utils.hasMatchingTag("Action", "GetStories"),
  function(msg)
    local data = json.decode(msg.Data)

    local offset    = data.offset
    local id        = data.id
    local address   = data.address

    local sql_all = [[
      SELECT * FROM stories ORDER BY coins DESC LIMIT 10 OFFSET :offset;
    ]]

    local sql_one = [[
      SELECT * FROM stories WHERE id = :id;
    ]]

    local stmt
    if id ~= '' then
      stmt = DB:prepare(sql_one)
    else
      stmt = DB:prepare(sql_all)
    end

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = id,
      offset = offset
    })

    local rows = query(stmt)
    Handlers.utils.reply(json.encode(rows))(msg)
  end
)

Handlers.add(
  "SendStory",
  Handlers.utils.hasMatchingTag("Action", "SendStory"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt, err = DB:prepare [[
      REPLACE INTO stories (id, address, post, range, category, likes, replies, coins, time)
      VALUES (:id, :address, :post, :range, :category, :likes, :replies, :coins, :time);
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      id = data.id,
      address = data.address,
      post = data.post,
      range = data.range,
      category = data.category,
      likes = data.likes,
      replies = data.replies,
      coins = data.coins,
      time = data.time
    })

    stmt:step()
    stmt:reset()
    print('SendStory Done!!')
  end
)

Handlers.add(
  "GetReplies",
  Handlers.utils.hasMatchingTag("Action", "GetReplies"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT * FROM replies WHERE post_id = :post_id ORDER BY time DESC LIMIT 10 OFFSET :offset;
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
    print('SendReply Done!!')
  end
)

Handlers.add(
  "UpdateReply",
  Handlers.utils.hasMatchingTag("Action", "UpdateReply"),
  function(msg)
    local id = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE stories SET replies = replies + 1 WHERE id = :id;
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
      UPDATE stories SET coins = coins + :coins WHERE id = :id;
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
      UPDATE stories SET likes = likes + 1 WHERE id = :id;
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

Handlers.add(
  "UpdateBountyForReply",
  Handlers.utils.hasMatchingTag("Action", "UpdateBountyForReply"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      UPDATE replies SET coins = coins + :coins WHERE id = :id;
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
    print('UpdateBountyForReply Done!!')
  end
)

Handlers.add(
  "GetStats",
  Handlers.utils.hasMatchingTag("Action", "GetStats"),
  function(msg)
    local data = json.decode(msg.Data)

    local stmt = DB:prepare [[
      SELECT SUM(likes) AS total_likes, SUM(coins) AS total_coins
      FROM replies
      WHERE post_id = :post_id;
    ]]

    if not stmt then
      error("Failed to prepare SQL statement: " .. DB:errmsg())
    end

    stmt:bind_names({
      post_id = data.post_id,
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
    print('SendTxid Done!!')
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
