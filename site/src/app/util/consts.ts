// export const AO_TWITTER = "Y4ZXUT9jFoHFg3K2XH5MVFf4_mXKHAcCsqgLta1au2U";
// export const AO_TWITTER = "Ekm_mCHSs9mawVqwqTi35qBaT-8DaORzYJ-c9Z3qMhY";
// export const AO_STORY = "Ur_5hhtX6zQEpFg9jPzFULMTLRvkBfp4bn7Od4Qj4Jk";

export const AO_TWITTER = "8s1ZpAx_NueKS4N2ZOMYWCkl5qVcGkgnBFSnqSVX9Fo";
export const AO_STORY = "AAwa2zqVLSMvxOPMjhUVtPHS_SN1ObbsaY27X9OPCbw";
export const STORY_INCOME = "LsNy8F1GSkGvE0IJ6g1RFpHHjKE6tmtXUT91WIv3PMQ";
export const CRED = "Sa0iBLPNyJQrwpTTG-tWLQU-1QeUAJA73DdxGGiKoJc";
export const TRUNK = "OT9qTE2467gcozb2g8R6D6N3nQS94ENcaAIJfUzHCww";
export const AOT_TEST = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
export const CHATROOM = "F__i_YGIUOGw43zyqLY9dEKNNEhB_uTqzL9tOTWJ-KA";
export const TIP_IMG = "Is there a picture in the post? Size just up to 100KB for now.";
export const ICON_SIZE = 28;
export const PAGE_SIZE = "10";

// Supporting the AO SQLite
export const MODULE = "GYrbbe0VbHim_7Hi6zrOpHQXrSQz07XNtwCnfbFo2I0"

export const SCHEDULER = "_GQ33BkPtZrqxA84vM8Zk-N2aO0toNNu_C-l-rawrBA"
export const ARWEAVE_GATEWAY = "https://arweave.net/";

export const TOKEN_PID = new Map([[0, AOT_TEST], [1, CRED], [2, TRUNK]]);
export const TOKEN_NAME = new Map([[0, 'TYPR'], [1, 'CRED'], [2, 'TRUNK']]);

export const LUA =
  `
  local json = require("json")
  local sqlite3 = require("lsqlite3")

  DB = DB or sqlite3.open_memory()
  
  DB:exec [[
    CREATE TABLE IF NOT EXISTS notis (
      reply_id TEXT PRIMARY KEY,
      post_id TEXT,
      noti_type TEXT,
      address TEXT,
      avatar TEXT,
      nickname TEXT,
      post TEXT,
      bounty INT,
      bounty_type TEXT,
      time INT
    );
  ]]
  
  AOT_TEST   = "UabERwDSwechOsHg9M1N6qTk2O7EXPf63qABDTAj_Vs";
  AO_TWITTER = "8s1ZpAx_NueKS4N2ZOMYWCkl5qVcGkgnBFSnqSVX9Fo";

  local function query(stmt)
    local rows = {}
    for row in stmt:nrows() do
      table.insert(rows, row)
    end
    stmt:reset()
    return rows
  end

  Handlers.add(
    "TransferToken",
    Handlers.utils.hasMatchingTag("Action", "TransferToken"),
    function(msg)
      if msg.From == Owner then
        local target = msg.Tags.Target
        if target == '' then
          target = AOT_TEST
        end

        ao.send({
          Target    = target,
          Action    = "Transfer",
          Recipient = msg.Tags.Recipient,
          Quantity  = msg.Tags.Quantity
        })
      end
    end
  )

  Handlers.add(
    "Record-Noti",
    Handlers.utils.hasMatchingTag("Action", "Record-Noti"),
    function(msg)
      local data = json.decode(msg.Data)

      local stmt = DB:prepare [[
        REPLACE INTO notis (reply_id, post_id, noti_type, address, avatar, nickname, post, bounty, bounty_type, time)
        VALUES (:reply_id, :post_id, :noti_type, :address, :avatar, :nickname, :post, :bounty, :bounty_type, :time);
      ]]

      if not stmt then
        error("Failed to prepare SQL statement: " .. DB:errmsg())
      end

      stmt:bind_names({
        reply_id = data.reply_id,
        post_id = data.post_id,
        noti_type = data.noti_type,
        address = data.address,
        avatar = data.avatar,
        nickname = data.nickname,
        post = data.post,
        bounty = data.bounty,
        bounty_type = data.bounty_type,
        time = data.time
      })

      stmt:step()
      stmt:reset()
      print('Record-Noti Done!')
    end
  )

  Handlers.add(
    "Get-Notis",
    Handlers.utils.hasMatchingTag("Action", "Get-Notis"),
    function(msg)
      local data = json.decode(msg.Data)

      local stmt = DB:prepare [[
        SELECT * FROM notis
        ORDER BY time DESC LIMIT 10 OFFSET :offset;
      ]]

      if not stmt then
        error("Failed to prepare SQL statement: " .. DB:errmsg())
      end

      stmt:bind_names({
        offset = data.offset
      })

      local rows = query(stmt)
      Handlers.utils.reply(json.encode(rows))(msg)
    end
  )
`;