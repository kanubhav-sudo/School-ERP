import { useQuery } from '@tanstack/react-query'
import { studentPortalApi } from '../api/student-portal.api'
import { User, Phone, MapPin, Mail, Droplet, Calendar as CalendarIcon, Info } from 'lucide-react'

export function StudentProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['student-profile'],
    queryFn: studentPortalApi.getProfile,
  })

  if (isLoading) return <div>Loading profile...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 space-y-6">
          <div className="bg-card border rounded-xl p-6 flex flex-col items-center text-center shadow-sm">
            <div className="h-32 w-32 rounded-full bg-muted overflow-hidden flex items-center justify-center mb-4">
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <User className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-xl font-bold">{profile?.firstName} {profile?.lastName}</h2>
            <p className="text-muted-foreground">{profile?.admissionNumber}</p>
            <div className="mt-4 w-full bg-primary/10 text-primary py-2 rounded-lg font-medium">
              Class {profile?.class?.name} - {profile?.section?.name}
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Info className="h-5 w-5 text-muted-foreground" />
              Personal Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Group</p>
                <p className="font-medium flex items-center gap-2">
                  <Droplet className="h-4 w-4 text-red-500" />
                  {profile?.bloodGroup || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{profile?.gender}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-muted-foreground" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{profile?.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {profile?.email || 'N/A'}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {profile?.address || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              Parent Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Father's Name</p>
                <p className="font-medium">{profile?.fatherName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-1">{profile?.fatherPhone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mother's Name</p>
                <p className="font-medium">{profile?.motherName || 'N/A'}</p>
                <p className="text-sm text-muted-foreground mt-1">{profile?.motherPhone}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
