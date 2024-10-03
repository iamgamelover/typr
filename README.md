# A Self-Sustaining Community

You can write stories.
You can play games.

These stories and games let you complete small or big things with people together.

You do things you are interested in and get an income.

Make your life better.
Make the world better.

## Dev Workflow
### Install dependencies
npm install

### Run on localhost
npm start


## Setup

Create a new process via CLI -- this will be the `server`

```
aos splx --sqlite
```

Load the program 
```
.load lua/life-app.lua
```

Create another process via CLI -- this will be the `client` 

DO NOT USE EXISTING CLIENT (v1 -> v2 upgrade)

``` 
aos personal
```

Run a quick test via `personal` process

```
Send({
    Target = "N54e6k_gxasjr_xBa5uKhEqH7tswR00NBtqskZrI9sQ",
    Action = "SendPost",
    Data = "{\"id\": \"test_post_123\", \"address\": \"test_address_abc\", \"post\": \"This is a test post content.\", \"range\": \"public\", \"likes\": 0, \"replies\": 0, \"coins\": 0, \"time\": 1686123456}"
})
```

hooray.


## testing

setup process with dbAdmin
```
.load-blueprint apm
apm.install "@rakis/DbAdmin"

.load splx-on-ao/lua/life-app.lua

.load splx-on-ao/lua/DbAdmin.lua
```

to test some queries

read
```
local sqlite3 = require("lsqlite3")
local dbAdmin = require("DbAdmin")

DB = DB or sqlite3.open_memory()
local admin = dbAdmin.new(DB)
-- local results = admin:exec("SELECT * FROM posts;")
local count = admin:count("posts")
print('results', count)
```