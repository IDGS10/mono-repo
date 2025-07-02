local http = require "resty.http"
local cjson = require "cjson"

ngx.header["Content-Type"] = "text/event-stream"
ngx.header["Cache-Control"] = "no-cache"
ngx.header["Connection"] = "keep-alive"

local httpc = http.new()
local url = "http://127.0.0.1:8086/api/v2/query?org=my-org" -- replace with your org
local token = "Token my-super-token" -- NOTE the "Token " prefix

local flux_query = [[
from(bucket:"iot-bucket")
  |> range(start: -1m)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> last()
]]

local function query_influx()
 local res, err = httpc:request_uri(url, {
        method = "POST",
        body = flux_query,
        headers = {
            ["Authorization"] = token,
            ["Content-Type"] = "application/vnd.flux",
            ["Accept"] = "application/csv"
        }
    })

    if not res then
        ngx.say("event: error\ndata: Failed to query InfluxDB: " .. (err or "unknown") .. "\n\n")
        ngx.flush(true)
        return
    end

    if res.status ~= 200 then
        ngx.say("event: error\ndata: InfluxDB returned status: " .. res.status .. "\n\n")
        ngx.flush(true)
        return
    end

    -- DEBUG: show raw response body and headers
    ngx.say("event: debug\ndata: response status = " .. res.status .. "\n\n")
   -- ngx.say("event: debug\ndata: response headers = " .. require("cjson").encode(res.headers) .. "\n\n")
     ngx.say("event: debug\ndata: response body = " .. (res.body or "") .. "\n\n")
  --  ngx.flush(true)

    -- The rest of your parsing logic here...

    -- Extract the temperature value from CSV body
    local csv = res.body
    local temp_value = "unknown"

	for line in csv:gmatch("[^\r\n]+") do
	    if line ~= "" and not line:match("^#") and not line:match("^result") and not line:match("^table") then
	        -- Remove leading commas
	        line = line:gsub("^,+", "")
	        local fields = {}
	        for field in line:gmatch("[^,]+") do
	            table.insert(fields, field)
	        end
	        temp_value = fields[7] or temp_value
	        break
	    end
	end


    local data = cjson.encode({ temperature = tonumber(temp_value) })

    ngx.say("data: " .. data .. "\n\n")

    ngx.flush(true)

--    ngx.exit(200)  -- stop after one iteration for debugging
end

while true do
    query_influx()
    ngx.sleep(3)
end
