-- Called by scripts/kit.ts: prints, for each frame, the colours of the label layers with a
-- pixel count, and the top row of the label. One line per frame: "<top> <#rrggbb>:<n> ...".
local spr = app.sprite
local names = {}
for n in string.gmatch(app.params.layers or '', '[^|]+') do
  names[n] = true
end

local function rgba(v)
  if spr.colorMode == ColorMode.INDEXED then
    if v == spr.transparentColor then
      return 0, 0, 0, 0
    end
    local c = spr.palettes[1]:getColor(v)
    return c.red, c.green, c.blue, c.alpha
  end
  local pc = app.pixelColor
  return pc.rgbaR(v), pc.rgbaG(v), pc.rgbaB(v), pc.rgbaA(v)
end

for _, frame in ipairs(spr.frames) do
  local counts, top = {}, 9999
  for _, layer in ipairs(spr.layers) do
    local cel = names[layer.name] and layer:cel(frame)
    if cel then
      for it in cel.image:pixels() do
        local r, g, b, a = rgba(it())
        if a > 0 then
          local k = string.format('#%02x%02x%02x', r, g, b)
          counts[k] = (counts[k] or 0) + 1
          top = math.min(top, cel.position.y + it.y)
        end
      end
    end
  end
  local line = { tostring(top) }
  for k, n in pairs(counts) do
    table.insert(line, k .. ':' .. n)
  end
  print(table.concat(line, ' '))
end
