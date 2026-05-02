import { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, Tag, Scale, Package, MapPin, Info } from 'lucide-react';

// Rack data from ST001.json (will be fetched from DB later)
const RACK_DATA = [
  { rack_id: 'str001r01', name: 'R1 Fruits',              total_columns: 8,  category: 'Fruits',             color: '#d6b129' },
  { rack_id: 'str001r02', name: 'R2 Vegetables',          total_columns: 8,  category: 'Vegetables',         color: '#70c021' },
  { rack_id: 'str001r03', name: 'R3 Cooking Essentials',  total_columns: 15, category: 'Cooking Essentials', color: '#FEE2E2' },
  { rack_id: 'str001r04', name: 'R4 Grains and Pulses',   total_columns: 15, category: 'Grains and Pulses',  color: '#439ecb' },
  { rack_id: 'str001r05', name: 'R5 Snacks & Bakery',     total_columns: 7,  category: 'Snacks & Bakery',    color: '#eebf58' },
  { rack_id: 'str001r06', name: 'R6 Dairy & Beverages',   total_columns: 7,  category: 'Dairy & Beverages',  color: '#76c0f9' },
  { rack_id: 'str001r07', name: 'R7 Frozen & Meat 2',     total_columns: 7,  category: 'Frozen & Meat',      color: '#75ffdd' },
  { rack_id: 'str001r08', name: 'R9 Personal Care',       total_columns: 8,  category: 'Personal Care',      color: '#732edc' },
  { rack_id: 'str001r09', name: 'R10 Household Cleaning', total_columns: 8,  category: 'Household Cleaning', color: '#c6b9b9' },
  { rack_id: 'str001r10', name: 'R8 Frozen & Meat 1',     total_columns: 7,  category: 'Frozen & Meat',      color: '#67fcfe' },
];

// Built-in categories
const DEFAULT_CATEGORIES = [
  { id: 'C1', name: 'Fruits' },
  { id: 'C2', name: 'Vegetables' },
  { id: 'C3', name: 'Cooking Essentials' },
  { id: 'C4', name: 'Grains and Pulses' },
  { id: 'C5', name: 'Snacks & Bakery' },
  { id: 'C6', name: 'Dairy & Beverages' },
  { id: 'C7', name: 'Frozen & Meat' },
  { id: 'C8', name: 'Personal Care' },
  { id: 'C9', name: 'Household Cleaning' },
];

// Types 
interface Category { id: string; name: string; }
interface FormErrors { [key: string]: string; }

interface ProductForm {
  name: string;
  category_id: string;
  category_name: string;
  label_variants: string[];
  weight_type: 'fixed' | 'variable';
  weight_g: string;
  unit_price_per_kg: string;
  price: string;
  rack_id: string;
  position_index: string;
  is_active: boolean;
}

export interface ProductData {
  item_id: string;
  name: string;
  category_id: string;
  category_name: string;
  label_variants: string[];
  weight_type: string;
  weight_g: number | null;
  unit_price_per_kg: number | null;
  price: number | null;
  rack_id: string;
  position_index: number;
  is_active: boolean;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: any) => void;
  editProduct?: ProductData | null; // null = add mode, ProductData = edit mode
}

//  Blank form 
const EMPTY_FORM: ProductForm = {
  name: '', category_id: '', category_name: '',
  label_variants: [], weight_type: 'fixed',
  weight_g: '', unit_price_per_kg: '', price: '',
  rack_id: '', position_index: '', is_active: true,
};

// load saved product into form
function toForm(p: ProductData): ProductForm {
  return {
    name: p.name,
    category_id: p.category_id,
    category_name: p.category_name,
    label_variants: [...p.label_variants],
    weight_type: p.weight_type as 'fixed' | 'variable',
    weight_g: p.weight_g != null ? String(p.weight_g) : '',
    unit_price_per_kg: p.unit_price_per_kg != null ? String(p.unit_price_per_kg) : '',
    price: p.price != null ? String(p.price) : '',
    rack_id: p.rack_id,
    position_index: String(p.position_index),
    is_active: p.is_active,
  };
}

//  UI primitives 
function SectionHeader({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
      <Icon style={{ width: 14, height: 14, color: '#ffffff', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#e2e8f0' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: 'rgba(71,85,105,0.6)', marginLeft: 4 }} />
    </div>
  );
}

function Field({ label, required, error, hint, children }: {
  label: string; required?: boolean; error?: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 500, color: '#ffffff' }}>
        {label}{required && <span style={{ color: '#f87171', marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {hint && !error && <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.4 }}>{hint}</p>}
      {error && <p style={{ fontSize: 11, color: '#f87171', margin: 0 }}>⚠ {error}</p>}
    </div>
  );
}

function StyledSelect({ value, onChange, placeholder, children, error }: {
  value: string; onChange: (v: string) => void; placeholder: string;
  children: React.ReactNode; error?: boolean;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', display: 'block', boxSizing: 'border-box',
          padding: '9px 40px 9px 12px', lineHeight: '1.5',
          background: 'rgba(30,41,59,0.8)',
          border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.5)'}`,
          borderRadius: 8, color: value ? '#f1f5f9' : '#64748b', fontSize: 13,
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          outline: 'none', cursor: 'pointer',
        } as React.CSSProperties}
      >
        <option value="" disabled style={{ color: '#64748b', background: '#1e293b' }}>{placeholder}</option>
        {children}
      </select>
      <ChevronDown style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8', pointerEvents: 'none' }} />
    </div>
  );
}

const inp = (error?: boolean): React.CSSProperties => ({
  width: '100%', padding: '9px 12px',
  background: 'rgba(30,41,59,0.8)',
  border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(71,85,105,0.5)'}`,
  borderRadius: 8, color: '#f1f5f9', fontSize: 13, outline: 'none',
  boxSizing: 'border-box' as const,
});


export default function AddProductModal({ isOpen, onClose, onSubmit, editProduct = null }: AddProductModalProps) {
  const isEditMode = editProduct != null;

  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [labelInput, setLabelInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [form, setForm] = useState<ProductForm>({ ...EMPTY_FORM });

  // Pre-fill on open
  useEffect(() => {
    if (!isOpen) return;
    setErrors({}); setLabelInput(''); setShowNewCat(false); setNewCatName('');
    setForm(isEditMode && editProduct ? toForm(editProduct) : { ...EMPTY_FORM });
  }, [isOpen, editProduct]);

  if (!isOpen) return null;

  const set = (key: keyof ProductForm, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const selectedRack = RACK_DATA.find(r => r.rack_id === form.rack_id);
  const maxPositions = selectedRack?.total_columns ?? null;

  // Category
  const selectCategory = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (cat) { set('category_id', cat.id); set('category_name', cat.name); }
  };
  const addNewCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    const exists = categories.find(c => c.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) { selectCategory(exists.id); setShowNewCat(false); setNewCatName(''); return; }
    const newId = `C${categories.length + 1}`;
    setCategories(prev => [...prev, { id: newId, name: trimmed }]);
    set('category_id', newId); set('category_name', trimmed);
    setShowNewCat(false); setNewCatName('');
  };

  // Labels
  const addLabel = () => {
    const t = labelInput.trim().toLowerCase();
    if (!t || form.label_variants.includes(t)) { setLabelInput(''); return; }
    set('label_variants', [...form.label_variants, t]); setLabelInput('');
  };
  const removeLabel = (i: number) => set('label_variants', form.label_variants.filter((_, idx) => idx !== i));

  // Rack
  const selectRack = (rackId: string) => { set('rack_id', rackId); set('position_index', ''); };

  // Validation
  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!form.name.trim())           e.name = 'Product name is required';
    if (!form.category_id)           e.category_id = 'Please select a category';
    if (!form.label_variants.length) e.label_variants = 'Add at least one search label';
    if (form.weight_type === 'fixed') {
      if (!form.weight_g || Number(form.weight_g) <= 0) e.weight_g = 'Enter a valid weight in grams';
      if (!form.price    || Number(form.price)    <= 0) e.price    = 'Enter a valid price';
    } else {
      if (!form.unit_price_per_kg || Number(form.unit_price_per_kg) <= 0)
        e.unit_price_per_kg = 'Enter a valid price per kg';
    }
    if (!form.rack_id) e.rack_id = 'Please select a rack';
    if (!form.position_index) {
      e.position_index = 'Position index is required';
    } else {
      const pos = Number(form.position_index);
      if (!Number.isInteger(pos) || pos < 1) e.position_index = 'Must be a positive integer';
      else if (maxPositions && pos > maxPositions) e.position_index = `Max position for this rack is ${maxPositions}`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      ...(isEditMode && editProduct ? { item_id: editProduct.item_id } : {}),
      name:              form.name.trim(),
      category_id:       form.category_id,
      category_name:     form.category_name,
      label_variants:    form.label_variants,
      weight_type:       form.weight_type,
      weight_g:          form.weight_type === 'fixed'    ? Number(form.weight_g)          : null,
      unit_price_per_kg: form.weight_type === 'variable' ? Number(form.unit_price_per_kg) : null,
      price:             form.weight_type === 'fixed'    ? Number(form.price)              : null,
      rack_id:           form.rack_id,
      position_index:    Number(form.position_index),
      is_active:         form.is_active,
    });
    onClose();
  };

  // shared btn style helper
  const ghostBtn = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: 'none', border: 'none', cursor: 'pointer', padding: 4,
    display: 'flex', alignItems: 'center', ...extra,
  });

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)', zIndex: 50 }} />

      {/* Modal panel */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '100%', maxWidth: 580, maxHeight: '90vh',
        background: 'rgba(13,20,35,0.97)', border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 16, boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
        zIndex: 51, display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', flexShrink: 0, borderBottom: '1px solid rgba(148,163,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ color: '#f1f5f9', fontSize: 18, fontWeight: 700, margin: 0 }}>
                {isEditMode ? 'Edit Product' : 'Add New Product'}
              </h2>
              {isEditMode && editProduct && (
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9', fontFamily: 'monospace' }}>
                  {editProduct.item_id}
                </span>
              )}
            </div>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 3 }}>
              {isEditMode ? 'Update the product details below' : 'Fill in all required fields to register a product'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(71,85,105,0.3)', border: 'none', borderRadius: 8, padding: '6px 7px', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/*BASIC INFO */}
            <SectionHeader icon={Package} label="Basic Info" />

            <Field label="Product Name" required error={errors.name}>
              <input style={inp(!!errors.name)} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Potato, Coconut Oil 1L" />
            </Field>

            <Field label="Category" required error={errors.category_id}>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <StyledSelect value={form.category_id} onChange={selectCategory} placeholder="Select category" error={!!errors.category_id}>
                    {categories.map(c => (
                      <option key={c.id} value={c.id} style={{ background: '#1e293b', color: '#f1f5f9' }}>{c.id} — {c.name}</option>
                    ))}
                  </StyledSelect>
                </div>
                <button onClick={() => setShowNewCat(!showNewCat)} style={{ padding: '9px 12px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, color: '#06b6d4', cursor: 'pointer', fontSize: 12, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus style={{ width: 12, height: 12 }} /> New
                </button>
              </div>
              {showNewCat && (
                <div style={{ marginTop: 8, padding: 12, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input style={{ ...inp(), flex: 1, fontSize: 12 }} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="New category name..." onKeyDown={e => e.key === 'Enter' && addNewCategory()} autoFocus />
                  <button onClick={addNewCategory} style={{ padding: '7px 14px', background: '#06b6d4', border: 'none', borderRadius: 7, color: '#000', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Add</button>
                  <button onClick={() => { setShowNewCat(false); setNewCatName(''); }} style={ghostBtn({ color: '#64748b' })}><X style={{ width: 14, height: 14 }} /></button>
                </div>
              )}
              {form.category_name && <p style={{ fontSize: 11, color: '#06b6d4', margin: 0 }}>✓ {form.category_id} — {form.category_name}</p>}
            </Field>

            {/* STATUS */}
            <SectionHeader icon={Package} label="Status" />

            <Field label="Product Status" hint="Controls whether this product is visible and searchable in the store">
              <button
                type="button"
                onClick={() => set('is_active', !form.is_active)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '11px 14px',
                  background: form.is_active ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${form.is_active ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  borderRadius: 8, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Toggle pill */}
                  <div style={{ width: 40, height: 22, borderRadius: 11, position: 'relative', background: form.is_active ? '#22c55e' : '#475569', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: form.is_active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)' }} />
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: form.is_active ? '#22c55e' : '#94a3b8' }}>
                      {form.is_active ? '● Active' : '○ Inactive'}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: '#64748b' }}>
                      {form.is_active ? 'Visible to customers in the store' : 'Hidden from customers'}
                    </p>
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#475569' }}>click to toggle</span>
              </button>
            </Field>

            {/*SEARCH LABELS */}
            <SectionHeader icon={Tag} label="Search Labels" />

            <Field label="Label Variants" required error={errors.label_variants} hint="Add all names/aliases customers might use (including regional language names)">
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ ...inp(), flex: 1 }} value={labelInput} onChange={e => setLabelInput(e.target.value)} placeholder="e.g. aloo, ഉരുളക്കിഴങ്ങ്, potato..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())} />
                <button onClick={addLabel} style={{ padding: '9px 14px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 8, color: '#06b6d4', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Plus style={{ width: 12, height: 12 }} /> Add
                </button>
              </div>
              {form.label_variants.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {form.label_variants.map((lv, i) => (
                    <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, color: '#67e8f9', fontSize: 12 }}>
                      {lv}
                      <button onClick={() => removeLabel(i)} style={ghostBtn({ color: '#67e8f9' })}><X style={{ width: 12, height: 12 }} /></button>
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* WEIGHT & PRICING  */}
            <SectionHeader icon={Scale} label="Weight & Pricing" />

            <Field label="Weight Type" required>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['fixed', 'variable'] as const).map(wt => (
                  <button key={wt} onClick={() => { set('weight_type', wt); set('weight_g', ''); set('unit_price_per_kg', ''); set('price', ''); }} style={{ flex: 1, padding: '10px 0', background: form.weight_type === wt ? 'rgba(6,182,212,0.15)' : 'rgba(30,41,59,0.8)', border: `1px solid ${form.weight_type === wt ? 'rgba(6,182,212,0.5)' : 'rgba(71,85,105,0.5)'}`, borderRadius: 8, cursor: 'pointer', color: form.weight_type === wt ? '#06b6d4' : '#94a3b8', fontSize: 13, fontWeight: form.weight_type === wt ? 600 : 400, transition: 'all 0.15s' }}>
                    {wt === 'fixed' ? '📦 Fixed Weight' : '⚖️ Variable (per kg)'}
                  </button>
                ))}
              </div>
              <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
                {form.weight_type === 'fixed' ? 'Item has a fixed weight and set price (e.g. packaged goods)' : 'Item is sold by weight (e.g. fresh produce, loose grains)'}
              </p>
            </Field>

            {form.weight_type === 'fixed' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Weight (grams)" required error={errors.weight_g}>
                  <div style={{ position: 'relative' }}>
                    <input type="number" min="1" style={{ ...inp(!!errors.weight_g), paddingRight: 36 }} value={form.weight_g} onChange={e => set('weight_g', e.target.value)} placeholder="e.g. 920" />
                    <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 11 }}>g</span>
                  </div>
                </Field>
                <Field label="Price (₹)" required error={errors.price}>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 12 }}>₹</span>
                    <input type="number" min="0" step="0.01" style={{ ...inp(!!errors.price), paddingLeft: 24 }} value={form.price} onChange={e => set('price', e.target.value)} placeholder="0.00" />
                  </div>
                </Field>
              </div>
            ) : (
              <Field label="Price per kg (₹)" required error={errors.unit_price_per_kg}>
                <div style={{ position: 'relative', maxWidth: 200 }}>
                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 12 }}>₹</span>
                  <input type="number" min="0" step="0.01" style={{ ...inp(!!errors.unit_price_per_kg), paddingLeft: 24 }} value={form.unit_price_per_kg} onChange={e => set('unit_price_per_kg', e.target.value)} placeholder="e.g. 35" />
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 11 }}>/kg</span>
                </div>
              </Field>
            )}

            {/* RACK PLACEMENT */}
            <SectionHeader icon={MapPin} label="Rack Placement" />

            <Field label="Rack" required error={errors.rack_id}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
                {RACK_DATA.map(rack => {
                  const sel = form.rack_id === rack.rack_id;
                  return (
                    <button key={rack.rack_id} onClick={() => selectRack(rack.rack_id)} style={{ padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: sel ? 'rgba(6,182,212,0.1)' : 'rgba(30,41,59,0.6)', border: `1px solid ${sel ? 'rgba(6,182,212,0.5)' : 'rgba(71,85,105,0.35)'}`, display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', transition: 'all 0.15s' }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, flexShrink: 0, background: rack.color, boxShadow: sel ? `0 0 8px ${rack.color}88` : 'none' }} />
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: sel ? '#67e8f9' : '#cbd5e1', fontSize: 12, fontWeight: sel ? 600 : 400, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rack.name}</p>
                        <p style={{ color: '#475569', fontSize: 10, margin: 0 }}>{rack.rack_id} · {rack.total_columns} slots</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Position Index" required error={errors.position_index}
              hint={selectedRack ? `Valid range: 1 – ${selectedRack.total_columns} (${selectedRack.name})` : 'Select a rack first to see available positions'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="number" min="1" max={maxPositions ?? undefined} disabled={!form.rack_id} style={{ ...inp(!!errors.position_index), width: 100, opacity: form.rack_id ? 1 : 0.4, cursor: form.rack_id ? 'text' : 'not-allowed' }} value={form.position_index} onChange={e => set('position_index', e.target.value)} placeholder="1" />
                {selectedRack && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {Array.from({ length: selectedRack.total_columns }, (_, i) => i + 1).map(pos => (
                      <button key={pos} onClick={() => set('position_index', String(pos))} style={{ width: 28, height: 28, background: form.position_index === String(pos) ? '#06b6d4' : 'rgba(30,41,59,0.8)', border: `1px solid ${form.position_index === String(pos) ? '#06b6d4' : 'rgba(71,85,105,0.5)'}`, borderRadius: 5, cursor: 'pointer', color: form.position_index === String(pos) ? '#000' : '#64748b', fontSize: 11, fontWeight: form.position_index === String(pos) ? 700 : 400 }}>
                        {pos}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </Field>

            {/* Auto-managed note */}
            <div style={{ padding: '10px 14px', background: 'rgba(71,85,105,0.1)', border: '1px solid rgba(71,85,105,0.2)', borderRadius: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Info style={{ width: 14, height: 14, color: '#64748b', marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: '#64748b', fontSize: 11, margin: 0, lineHeight: 1.5 }}>
                Auto-managed by backend: <span style={{ color: '#94a3b8' }}>item_id, store_id, created_at, updated_at</span>
              </p>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(148,163,184,0.1)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 20px', background: 'rgba(71,85,105,0.2)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 16px rgba(6,182,212,0.3)' }}>
            {isEditMode ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>

      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { opacity: 0.4; }
        input::placeholder { color: #475569; }
        select option { background: #1e293b; color: #f1f5f9; }
      `}</style>
    </>
  );
}