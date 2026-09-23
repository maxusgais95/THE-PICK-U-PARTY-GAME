const fs = require('fs');
let content = fs.readFileSync('src/components/admin/StoreItemModal.tsx', 'utf8');

const startIdx = content.indexOf('{/* Image & Appearance Section */}');
const endIdx = content.indexOf('{/* Footer Actions */}');

if (startIdx !== -1 && endIdx !== -1) {
  const newSection = `{/* Image & Appearance Section */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  id="btn-upload-item-image"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-xs font-semibold text-zinc-200 flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload Image File</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Bounding Box Preview */}
                <div className="w-12 h-12 rounded-lg bg-zinc-900 border border-dashed border-zinc-700 flex items-center justify-center p-1 relative overflow-hidden shrink-0">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt="Uploaded preview"
                      className="max-w-full max-h-full object-contain"
                      style={{ filter: isEnhanced ? ENHANCE_FILTER : undefined }}
                    />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-zinc-600" />
                  )}
                </div>
              </div>

              {/* Enhance Checkbox */}
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="store-item-enhance-checkbox"
                  checked={isEnhanced}
                  onChange={(e) => setIsEnhanced(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="store-item-enhance-checkbox" className="text-xs font-semibold text-zinc-200 cursor-pointer select-none">
                  Enhance
                </label>
              </div>
            </div>`;

  content = content.slice(0, startIdx) + newSection + '\n\n          </div>\n          ' + content.slice(endIdx);
  fs.writeFileSync('src/components/admin/StoreItemModal.tsx', content, 'utf8');
  console.log('Successfully updated StoreItemModal with upload bounding box preview!');
} else {
  console.log('Markers not found.');
}
