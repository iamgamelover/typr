local dbAdmin = {}
dbAdmin.__index = dbAdmin

-- Function to create a new database explorer instance
function dbAdmin.new(db)
    local self = setmetatable({}, dbAdmin)
    self.db = db
    return self
end

-- Function to list all tables in the database
function dbAdmin:tables()
    local tables = {}
    for row in self.db:nrows("SELECT name FROM sqlite_master WHERE type='table';") do
        table.insert(tables, row.name)
    end
    return tables
end

-- Function to get the record count of a table
function dbAdmin:count(tableName)
    local count_query = string.format("SELECT COUNT(*) AS count FROM %s;", tableName)
    for row in self.db:nrows(count_query) do
        return row.count
    end
end

-- Function to execute a given SQL query
function dbAdmin:exec(sql)
    local results = {}
    for row in self.db:nrows(sql) do
        table.insert(results, row)
    end
    return results
end

-- Function to apply SQL INSERT, UPDATE, and DELETE statements with parameter binding
function dbAdmin:apply(sql, values)
    local DONE = require('lsqlite3').DONE
    assert(type(sql) == 'string', 'SQL MUST be a String')
    assert(type(values) == 'table', 'values MUST be an array of values')
    
    local stmt = self.db:prepare(sql)
    stmt:bind_values(table.unpack(values))
    
    if stmt:step() ~= DONE then
        error(sql .. ' statement failed because ' .. self.db:errmsg())
    end
    
    stmt:finalize()
end

-- Function to apply SQL SELECT statements with parameter binding
function dbAdmin:select(sql, values)
   local sqlite3 = require('lsqlite3')
   local DONE = sqlite3.DONE
   assert(type(sql) == 'string', 'SQL MUST be a String')
   assert(type(values) == 'table', 'values MUST be an array of values')

   local stmt = self.db:prepare(sql)
   stmt:bind_values(table.unpack(values))

   local results = {}
   while true do
       local row = stmt:step()
       if row == sqlite3.ROW then
           table.insert(results, stmt:get_named_values()) 
       elseif row == DONE then
           break
       else
           error(sql .. ' statement failed because ' .. self.db:errmsg())
       end
   end

   stmt:finalize()
   return results
end

return dbAdmin