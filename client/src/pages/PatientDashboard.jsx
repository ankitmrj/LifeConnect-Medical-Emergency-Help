import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import MapView from '../components/MapView';
import {
  Siren,
  MapPinned,
  PhoneCall,
  HeartPulse
} from 'lucide-react';

export default function PatientDashboard() {
  const [profile, setProfile] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [active, setActive] = useState(null);
  const [msg, setMsg] = useState('');
  const [location, setLocation] = useState(null);

  // Blood group editing
  const [editingBlood, setEditingBlood] = useState(false);
  const [bloodGroup, setBloodGroup] = useState('');

  const { user } = useAuth();

  // Load patient data
  useEffect(() => {
    api
      .get('/patients/profile')
      .then(r => setProfile(r.data.data.profile))
      .catch(e => {
        setMsg(
          e.response?.data?.message ||
          'Failed to load medical profile'
        );
      });

    api
      .get('/patients/emergency-history')
      .then(r =>
        setActive(
          r.data.data.items.find(
            e =>
              !['COMPLETED', 'CANCELLED', 'REJECTED'].includes(
                e.status
              )
          ) || null
        )
      )
      .catch(() => {});

    // Get current location
    navigator.geolocation?.getCurrentPosition(
      p => {
        setLocation([
          p.coords.longitude,
          p.coords.latitude
        ]);

        api
          .get(
            `/hospitals/nearby?lat=${p.coords.latitude}&lng=${p.coords.longitude}&radius=25`
          )
          .then(r =>
            setNearby(r.data.data.hospitals)
          )
          .catch(() => {});
      }
    );
  }, []);

  // Socket.IO events
  useSocket({
    'emergency:created': e => {
      setActive(e);
    },

    'emergency:accepted': e => {
      setMsg('Hospital accepted your emergency');

      api
        .get(`/emergencies/${e.emergencyId}`)
        .then(r =>
          setActive(r.data.data.emergency)
        );
    },

    'ambulance:assigned': e => {
      setMsg('Ambulance assigned');

      api
        .get(`/emergencies/${e.emergencyId}`)
        .then(r =>
          setActive(r.data.data.emergency)
        );
    },

    'ambulance:location-update': e => {
      setActive(a =>
        a
          ? {
              ...a,
              liveAmbulanceLocation:
                e.location.coordinates
            }
          : a
      );
    },

    'emergency:status-update': e => {
      setActive(a =>
        a
          ? {
              ...a,
              status: e.status
            }
          : a
      );
    }
  });

  // SOS
  const sos = () => {
    navigator.geolocation?.getCurrentPosition(
      async p => {
        try {
          setMsg('SOS sending…');

          const r = await api.post(
            '/emergencies/sos',
            {
              lat: p.coords.latitude,
              lng: p.coords.longitude,
              emergencyType: 'General',
              priority: 'CRITICAL',
              description:
                'One-tap patient emergency'
            }
          );

          setActive(r.data.data.emergency);
          setNearby(r.data.data.hospitals);
          setMsg(
            'SOS sent. Nearby responders have been notified.'
          );
        } catch (e) {
          setMsg(
            e.response?.data?.message ||
            'SOS failed'
          );
        }
      },
      () =>
        setMsg(
          'Location permission is required for SOS'
        )
    );
  };

  // Save blood group
  const saveBloodGroup = async () => {
    if (!bloodGroup) {
      setMsg('Please select a blood group');
      return;
    }

    try {
      const r = await api.put(
        '/patients/profile',
        { bloodGroup }
      );

      setProfile(r.data.data.profile);
      setEditingBlood(false);
      setMsg('Medical profile updated');
    } catch (e) {
      setMsg(
        e.response?.data?.message ||
        'Failed to update blood group'
      );
    }
  };

  return (
    <div className="space-y-6">

      {/* Emergency Center + Medical Profile */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">

        {/* Emergency Center */}
        <div className="rounded-3xl bg-white p-7 shadow-sm border">

          <div className="text-sm text-slate-500">
            Welcome, {user.name}
          </div>

          <h1 className="mt-1 text-4xl font-black">
            Emergency center
          </h1>

          <button
            onClick={sos}
            className="pulse mx-auto mt-10 grid h-56 w-56 place-items-center rounded-full bg-red-600 text-white shadow-xl"
          >
            <span className="text-center">

              <Siren
                className="mx-auto"
                size={54}
              />

              <span className="mt-2 block text-2xl font-black">
                SOS
              </span>

              <span className="block text-xs font-bold uppercase tracking-widest">
                Send emergency
              </span>

            </span>
          </button>

          {msg && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-sm">
              {msg}
            </div>
          )}

        </div>


        {/* Medical Profile */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">

          <div className="flex items-center gap-2 font-bold">

            <HeartPulse className="text-red-600" />

            Medical profile

          </div>


          <div className="mt-5 space-y-3 text-sm">

            {profile ? (
              <>
                <div>
                  <b>Blood group:</b>{' '}
                  {profile.bloodGroup || 'Not set'}
                </div>

                <div>
                  <b>Allergies:</b>{' '}
                  {(profile.allergies || []).join(', ') ||
                    'None recorded'}
                </div>

                <div>
                  <b>Conditions:</b>{' '}
                  {(profile.medicalConditions || []).join(
                    ', '
                  ) || 'None recorded'}
                </div>

                <div>
                  <b>Medications:</b>{' '}
                  {(profile.medications || []).join(
                    ', '
                  ) || 'None recorded'}
                </div>
              </>
            ) : (
              <div>
                Loading profile…
              </div>
            )}

          </div>


          {/* Emergency Contacts */}
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">

            <b>Emergency contacts</b>

            <div className="mt-2 text-sm">

              {profile?.emergencyContacts?.length ? (
                profile.emergencyContacts.map(c => (
                  <div
                    key={c._id}
                    className="flex items-center gap-2"
                  >
                    <PhoneCall size={14} />

                    {c.name} · {c.phone}
                  </div>
                ))
              ) : (
                <div>
                  No emergency contacts added
                </div>
              )}

            </div>

          </div>


          {/* Edit Blood Group */}
          {editingBlood ? (

            <div className="mt-4 flex flex-wrap gap-2">

              <select
                value={bloodGroup}
                onChange={e =>
                  setBloodGroup(e.target.value)
                }
                className="rounded-lg border px-3 py-2 font-bold"
              >

                <option value="">
                  Select blood group
                </option>

                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>

              </select>


              <button
                onClick={saveBloodGroup}
                className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white"
              >
                Save
              </button>


              <button
                onClick={() => {
                  setEditingBlood(false);
                  setBloodGroup('');
                }}
                className="rounded-lg border px-4 py-2 font-bold"
              >
                Cancel
              </button>

            </div>

          ) : (

            <button
              onClick={() => {
                setBloodGroup(
                  profile?.bloodGroup || ''
                );

                setEditingBlood(true);
              }}
              className="mt-4 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-slate-50"
            >
              Edit blood group
            </button>

          )}

        </div>

      </section>


      {/* Nearby Hospitals */}
      <section className="rounded-3xl border bg-white p-6 shadow-sm">

        <div className="flex items-center justify-between">

          <h2 className="flex items-center gap-2 text-xl font-black">

            <MapPinned className="text-red-600" />

            Nearby hospitals

          </h2>

          <span className="text-sm text-slate-500">
            Ranked by distance + capability
          </span>

        </div>


        <div className="mt-5 grid gap-4 md:grid-cols-2">

          {nearby.map(h => (

            <div
              key={h._id}
              className="rounded-2xl border p-4"
            >

              <div className="font-bold">
                {h.name}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {h.distanceKm} km · score {h.score}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">

                <span className="rounded-full bg-emerald-50 px-2 py-1">
                  Beds {h.availableBeds}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  ICU {h.icuAvailable ? 'Yes' : 'No'}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  O₂ {h.oxygenAvailable ? 'Yes' : 'No'}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Ambulance{' '}
                  {h.ambulanceAvailable
                    ? 'Yes'
                    : 'No'}
                </span>

              </div>

            </div>

          ))}

        </div>

      </section>


      {/* Map */}
      {location && (
        <section className="rounded-3xl border bg-white p-4 shadow-sm">

          <MapView
            center={[
              location[1],
              location[0]
            ]}
            patient={location}
            hospitals={nearby}
            ambulance={
              active?.liveAmbulanceLocation
            }
          />

        </section>
      )}


      {/* Active Emergency */}
      {active && (
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">

          <div className="text-xs uppercase tracking-widest text-slate-400">
            Active emergency
          </div>

          <div className="mt-1 flex items-center justify-between">

            <h2 className="text-2xl font-black">
              #{String(active._id).slice(-8)}
            </h2>

            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold">
              {active.status}
            </span>

          </div>

          <div className="mt-4 text-slate-300">

            {active.hospitalId?.name ||
              'Searching hospitals…'}

            {active.ambulanceId?.vehicleNumber
              ? ` · ${active.ambulanceId.vehicleNumber}`
              : ''}

          </div>


          <button
            onClick={async () => {
              try {
                await api.post(
                  `/emergencies/${active._id}/cancel`
                );

                setActive(null);
                setMsg('Emergency cancelled');

              } catch (e) {
                setMsg(
                  e.response?.data?.message ||
                  'Failed to cancel emergency'
                );
              }
            }}
            className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-sm font-bold"
          >
            Cancel emergency
          </button>

        </section>
      )}

    </div>
  );
}