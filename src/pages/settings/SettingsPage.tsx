import { useEffect, useRef, useState } from 'react'
import {
  User as UserIcon,
  Palette,
  Eye,
  EyeOff,
  Lock,
  Tags,
  Plus,
  Trash2,
  Loader2,
  Sun,
  Moon,
  Check,
  Camera,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase/client'
import { getCategories, createCategory, deleteCategory } from '@/services/inventory'
import { uploadProfileAvatar } from '@/services/profile'
import type { InventoryCategory } from '@/types/database'
import { getErrorMessage } from '@/lib/errors'
import { PHOTO_ACCEPT, PHOTO_TYPES, PHOTO_TYPE_ERROR } from '@/lib/images'

function Section({ icon: Icon, title, description, children }: {
  icon: typeof UserIcon
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border-default bg-surface p-5 card-enhanced">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg icon-gradient-primary text-primary">
          <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
          {description && <p className="text-xs text-text-muted">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}

function PasswordInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder="••••••••"
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth()
  const { theme, toggleTheme } = useTheme()

  // Profile
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Password
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState<{ ok: boolean; text: string } | null>(null)

  // Categories
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [catLoading, setCatLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [catBusy, setCatBusy] = useState(false)
  const [catMsg, setCatMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setFullName(profile?.full_name || '')
    setAvatarUrl(profile?.avatar_url || '')
  }, [profile])
  useEffect(() => { getCategories().then(setCategories).catch(() => setCategories([])).finally(() => setCatLoading(false)) }, [])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!PHOTO_TYPES.includes(file.type)) { setProfileMsg({ ok: false, text: PHOTO_TYPE_ERROR }); return }
    if (file.size > 5 * 1024 * 1024) { setProfileMsg({ ok: false, text: 'Image must be smaller than 5 MB' }); return }
    setProfileMsg(null)
    setUploading(true)
    try {
      setAvatarUrl(await uploadProfileAvatar(file))
    } catch (err) {
      setProfileMsg({ ok: false, text: getErrorMessage(err, 'Failed to upload photo') })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const saveProfile = async () => {
    if (!user?.id || !fullName.trim()) return
    setSavingProfile(true)
    setProfileMsg(null)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), avatar_url: avatarUrl || null })
        .eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setProfileMsg({ ok: true, text: 'Profile updated' })
    } catch (err) {
      setProfileMsg({ ok: false, text: getErrorMessage(err, 'Failed to update profile') })
    } finally {
      setSavingProfile(false)
    }
  }

  const savePassword = async () => {
    setPassMsg(null)
    if (newPass.length < 6) { setPassMsg({ ok: false, text: 'Password must be at least 6 characters' }); return }
    if (newPass !== confirmPass) { setPassMsg({ ok: false, text: 'Passwords do not match' }); return }
    setSavingPass(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPass })
      if (error) throw error
      setNewPass(''); setConfirmPass('')
      setPassMsg({ ok: true, text: 'Password changed' })
    } catch (err) {
      setPassMsg({ ok: false, text: getErrorMessage(err, 'Failed to change password') })
    } finally {
      setSavingPass(false)
    }
  }

  const addCategory = async () => {
    if (!newCategory.trim()) return
    setCatBusy(true)
    setCatMsg(null)
    try {
      await createCategory(newCategory)
      setNewCategory('')
      setCategories(await getCategories())
    } catch (err) {
      setCatMsg({ ok: false, text: getErrorMessage(err, 'Failed to add category') })
    } finally {
      setCatBusy(false)
    }
  }

  const removeCategory = async (cat: InventoryCategory) => {
    setCatMsg(null)
    try {
      await deleteCategory(cat.id, cat.name)
      setCategories(await getCategories())
    } catch (err) {
      setCatMsg({ ok: false, text: getErrorMessage(err, 'Failed to delete category') })
    }
  }

  const msgLine = (m: { ok: boolean; text: string } | null) =>
    m && (
      <p className={`mt-2 text-xs ${m.ok ? 'text-success' : 'text-danger'}`}>
        {m.ok && <Check className="mr-1 inline h-3 w-3" />}{m.text}
      </p>
    )

  return (
    <div className="mx-auto max-w-2xl space-y-5 page-enter">
      {/* Profile */}
      <Section icon={UserIcon} title="Profile" description="Your account details">
        <div className="space-y-3">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept={PHOTO_ACCEPT} className="hidden" onChange={handlePhotoChange} />
            <button
              type="button"
              onClick={() => { if (!uploading) fileInputRef.current?.click() }}
              aria-label="Upload profile photo"
              className="group relative h-16 w-16 shrink-0 rounded-full focus:outline-none"
            >
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-surface bg-surface-secondary shadow-sm ring-1 ring-border-default">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-text-muted">
                    <UserIcon className="h-7 w-7" strokeWidth={1.5} />
                  </div>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/55">
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                  </div>
                )}
              </div>
              <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-text-inverse ring-2 ring-surface">
                <Camera className="h-2.5 w-2.5" />
              </span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-md border border-border-default px-3 py-1.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-surface-secondary disabled:opacity-50">
                  <Camera className="h-3.5 w-3.5" />
                  {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
                </button>
                {avatarUrl && !uploading && (
                  <button type="button" onClick={() => setAvatarUrl('')} className="rounded-md px-2 py-1.5 text-[13px] font-medium text-danger transition-colors hover:bg-danger/10">Remove</button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-text-muted">JPG or PNG · up to 5&nbsp;MB</p>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Full Name</label>
            <Input value={fullName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFullName(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Email</label>
              <Input value={user?.email || ''} disabled className="opacity-60" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Role</label>
              <Input value={profile?.role === 'it_admin' ? 'IT Admin' : 'Office Manager'} disabled className="opacity-60" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={saveProfile} disabled={savingProfile || !fullName.trim()} className="bg-primary text-text-inverse hover:bg-primary-hover">
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
            {msgLine(profileMsg)}
          </div>
        </div>
      </Section>

      {/* Appearance */}
      <Section icon={Palette} title="Appearance" description="Theme preference">
        <div className="flex gap-2">
          <button
            onClick={() => { if (theme !== 'light') toggleTheme() }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${theme === 'light' ? 'border-primary bg-primary/5 text-primary' : 'border-border-default text-text-secondary hover:bg-surface-secondary'}`}
          >
            <Sun className="h-4 w-4" /> Light
          </button>
          <button
            onClick={() => { if (theme !== 'dark') toggleTheme() }}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm transition-colors ${theme === 'dark' ? 'border-primary bg-primary/5 text-primary' : 'border-border-default text-text-secondary hover:bg-surface-secondary'}`}
          >
            <Moon className="h-4 w-4" /> Dark
          </button>
        </div>
      </Section>

      {/* Change Password */}
      <Section icon={Lock} title="Change Password" description="Update your login password">
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">New Password</label>
              <PasswordInput value={newPass} onChange={setNewPass} />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] sm:text-sm font-medium text-text-primary">Confirm Password</label>
              <PasswordInput value={confirmPass} onChange={setConfirmPass} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={savePassword} disabled={savingPass || !newPass} className="bg-primary text-text-inverse hover:bg-primary-hover">
              {savingPass ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Password'}
            </Button>
            {msgLine(passMsg)}
          </div>
        </div>
      </Section>

      {/* Inventory Categories */}
      <Section icon={Tags} title="Inventory Categories" description="Manage categories used in inventory">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === 'Enter') addCategory() }}
              placeholder="New category name"
            />
            <Button onClick={addCategory} disabled={catBusy || !newCategory.trim()} className="shrink-0 bg-primary text-text-inverse hover:bg-primary-hover gap-1">
              {catBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add
            </Button>
          </div>
          {msgLine(catMsg)}
          <div className="divide-y divide-border-default rounded-lg border border-border-default">
            {catLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <p className="px-3 py-4 text-sm text-text-muted">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-text-primary">{cat.name}</span>
                  <button
                    onClick={() => removeCategory(cat)}
                    className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </Section>
    </div>
  )
}
