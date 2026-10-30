-- Saves each layer of icons.aseprite as a 32x32 PNG in app.params.out. Each icon sits in a 32x32
-- cell on a 16 px grid, so the cell is the 32 px box on that grid that holds the art. The empty
-- space in the cell stays, so every icon keeps its place and its scale.
local SIZE = 32
local GRID = 16
local sprite = app.activeSprite

for _, layer in ipairs(sprite.layers) do
  local cel = layer:cel(1)
  if cel then
    -- The cel image can have empty edges, so the art bounds come from the image itself.
    local art = cel.image:shrinkBounds()
    local x = cel.position.x + art.x
    local y = cel.position.y + art.y
    local cx = x // GRID * GRID
    local cy = y // GRID * GRID
    if x + art.width > cx + SIZE or y + art.height > cy + SIZE then
      error(layer.name .. ' does not fit in one 32x32 cell')
    end
    local image = Image(SIZE, SIZE, sprite.colorMode)
    image:drawImage(cel.image, Point(cel.position.x - cx, cel.position.y - cy))
    image:saveAs { filename = app.params.out .. '/' .. layer.name .. '.png', palette = sprite.palettes[1] }
  end
end
