import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../hooks/useSocket";
import { api } from "../services/api";

import MapView from "../components/MapView";

import {
  Siren,
  MapPinned,
  PhoneCall,
  HeartPulse,
  Ambulance,
  Bed,
  Droplets,
  ShieldPlus,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const RESOURCE_OPTIONS = [
  { value: "ANTIVENOM", label: "Antivenom", icon: ShieldPlus },
  { value: "BLOOD", label: "Blood", icon: Droplets },
  { value: "AMBULANCE", label: "Ambulance", icon: Ambulance },
  { value: "ICU_BED", label: "ICU / Bed", icon: Bed },
];

export default function PatientDashboard() {
  // -----------------------------
  // Patient data
  // -----------------------------
  const [profile, setProfile] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [activeEmergency, setActiveEmergency] = useState(null);
  const [message, setMessage] = useState("");
  const [location, setLocation] = useState(null);

  // -----------------------------
  // Blood group editing
  // -----------------------------
  const [editingBlood, setEditingBlood] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState(null);
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "", email: "" });
  const [editingContact, setEditingContact] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [resourceSelection, setResourceSelection] = useState([]);
  const [searching, setSearching] = useState(false);

  const { user } = useAuth();

  // -----------------------------
  // Load patient data
  // -----------------------------
  useEffect(() => {
    // Load medical profile
    api
      .get("/patients/profile")
      .then((response) => {
        const nextProfile = response.data.data.profile;
        setProfile(nextProfile);
        setProfileForm(toProfileForm(nextProfile));
      })
      .catch((error) => {
        setMessage(
          error.response?.data?.message ||
            "Failed to load medical profile"
        );
      });

    // Load emergency history
    api
      .get("/patients/emergency-history")
      .then((response) => {
        const activeEmergency =
          response.data.data.items.find(
            (emergency) =>
              ![
                "COMPLETED",
                "CANCELLED",
                "REJECTED",
              ].includes(emergency.status)
          ) || null;

        setActiveEmergency(activeEmergency);
      })
      .catch(() => {});

    // Get current location
    navigator.geolocation?.getCurrentPosition(
      (position) => {
        const currentLocation = [
          position.coords.longitude,
          position.coords.latitude,
        ];

        setLocation(currentLocation);

        // Find nearby hospitals
        api
          .get(
            `/hospitals/nearby?lat=${position.coords.latitude}&lng=${position.coords.longitude}&radius=25`
          )
          .then((response) => {
            setNearbyHospitals(
              response.data.data.hospitals
            );
          })
          .catch(() => {});
      }
    );
  }, []);

  const toProfileForm = (value) => ({
    allergies: (value.allergies || []).join(", "),
    medicalConditions: (value.medicalConditions || []).join(", "),
    medications: (value.medications || []).join(", "),
    bloodGroup: value.bloodGroup || "",
    gender: value.gender || "",
    dateOfBirth: value.dateOfBirth ? String(value.dateOfBirth).slice(0, 10) : "",
    address: value.address || "",
    medicalNotes: value.medicalNotes || "",
  });

  const splitList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

  // -----------------------------
  // Socket.IO events
  // -----------------------------
  useSocket({
    // Emergency created
    "emergency:created": (emergency) => {
      setActiveEmergency(emergency);
    },

    // Hospital accepted emergency
    "emergency:accepted": (event) => {
      setMessage(
        "Hospital accepted your emergency"
      );

      api
        .get(`/emergencies/${event.emergencyId}`)
        .then((response) => {
          setActiveEmergency(
            response.data.data.emergency
          );
        });
    },

    // Ambulance assigned
    "ambulance:assigned": (event) => {
      setMessage("Ambulance assigned");

      api
        .get(`/emergencies/${event.emergencyId}`)
        .then((response) => {
          setActiveEmergency(
            response.data.data.emergency
          );
        });
    },

    // Ambulance location update
    "ambulance:location-update": (event) => {
      setActiveEmergency((current) =>
        current
          ? {
              ...current,
              liveAmbulanceLocation:
                event.location.coordinates,
            }
          : current
      );
    },

    // Emergency status update
    "emergency:status-update": (event) => {
      setActiveEmergency((current) =>
        current
          ? {
              ...current,
              status: event.status,
            }
          : current
      );
    },
  });

  // -----------------------------
  // Send SOS
  // -----------------------------
  const sendSOS = (hospitalId) => {
    if (!resourceSelection.length) {
      setMessage("Select at least one emergency resource first");
      return;
    }
    if (resourceSelection.includes("BLOOD") && !profile?.bloodGroup) {
      setMessage("Add your blood group before requesting blood");
      return;
    }
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        try {
          setMessage("SOS sending…");

          const response = await api.post(
            "/emergencies/sos",
            {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              emergencyType: "General",
              priority: "CRITICAL",
              description:
                `Patient requested: ${resourceSelection.join(", ")}`,
              requestedResources: resourceSelection,
              bloodGroup: profile?.bloodGroup,
              hospitalId,
            }
          );

          setActiveEmergency(
            response.data.data.emergency
          );

          setNearbyHospitals(
            response.data.data.hospitals
          );

          setMessage(
            "SOS sent. Nearby responders have been notified."
          );
        } catch (error) {
          setMessage(
            error.response?.data?.message ||
              "SOS failed"
          );
        }
      },
      () => {
        setMessage(
          "Location permission is required for SOS"
        );
      }
    );
  };

  const searchHospitals = () => {
    if (!resourceSelection.length) {
      setMessage("Select at least one emergency resource first");
      return;
    }
    if (resourceSelection.includes("BLOOD") && !profile?.bloodGroup) {
      setMessage("Add your blood group before searching for blood");
      return;
    }
    setSearching(true);
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        const params = new URLSearchParams({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius: "25",
          resources: resourceSelection.join(","),
        });
        if (profile?.bloodGroup) params.set("bloodGroup", profile.bloodGroup);
        setLocation([position.coords.longitude, position.coords.latitude]);
        try {
          const response = await api.get(`/hospitals/nearby?${params}`);
          setNearbyHospitals(response.data.data.hospitals);
          setMessage(response.data.data.hospitals.length ? "Nearby hospitals found" : "No hospitals found for these resources");
        } catch {
          setMessage("Unable to search nearby hospitals");
        } finally {
          setSearching(false);
        }
      },
      () => {
        setSearching(false);
        setMessage("Location unavailable. Allow location access to search hospitals");
      }
    );
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const response = await api.put("/patients/profile", {
        ...profileForm,
        allergies: splitList(profileForm.allergies),
        medicalConditions: splitList(profileForm.medicalConditions),
        medications: splitList(profileForm.medications),
      });
      setProfile(response.data.data.profile);
      setProfileForm(toProfileForm(response.data.data.profile));
      setEditingProfile(false);
      setMessage("Medical profile updated");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to update medical profile");
    }
  };

  const saveContact = async (event) => {
    event.preventDefault();
    try {
      const response = editingContact
        ? await api.patch(`/patients/emergency-contact/${editingContact}`, contactForm)
        : await api.post("/patients/emergency-contact", contactForm);
      setProfile((current) => ({ ...current, emergencyContacts: response.data.data.contacts }));
      setContactForm({ name: "", relationship: "", phone: "", email: "" });
      setEditingContact(null);
      setShowContactForm(false);
      setMessage("Emergency contact saved");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to save emergency contact");
    }
  };

  const deleteContact = async (contactId) => {
    try {
      const response = await api.delete(`/patients/emergency-contact/${contactId}`);
      setProfile((current) => ({ ...current, emergencyContacts: response.data.data.contacts }));
      setMessage("Emergency contact deleted");
    } catch (error) {
      setMessage(error.response?.data?.message || "Failed to delete emergency contact");
    }
  };

  // -----------------------------
  // Save blood group
  // -----------------------------
  const saveBloodGroup = async () => {
    if (!bloodGroup) {
      setMessage(
        "Please select a blood group"
      );
      return;
    }

    try {
      const response = await api.put(
        "/patients/profile",
        {
          bloodGroup,
        }
      );

      setProfile(response.data.data.profile);
      setEditingBlood(false);
      setMessage("Medical profile updated");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to update blood group"
      );
    }
  };

  // -----------------------------
  // Cancel emergency
  // -----------------------------
  const cancelEmergency = async () => {
    try {
      await api.post(
        `/emergencies/${activeEmergency._id}/cancel`
      );

      setActiveEmergency(null);
      setMessage("Emergency cancelled");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Failed to cancel emergency"
      );
    }
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="space-y-6">
      {/* =================================
          Emergency Center + Medical Profile
          ================================= */}
      <section className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
        {/* Emergency Center */}
        <div className="rounded-3xl border bg-white p-7 shadow-sm">
          <div className="text-sm text-slate-500">
            Welcome, {user.name}
          </div>

          <h1 className="mt-1 text-4xl font-black">
            Emergency Center
          </h1>

          {/* SOS Button */}
          <button
            onClick={() => sendSOS()}
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

          {/* Message */}
          {message && (
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-center text-sm">
              {message}
            </div>
          )}
        </div>

        {/* Medical Profile */}
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <HeartPulse className="text-red-600" />
            Medical Profile
          </div>

          {/* Medical Information */}
          <div className="mt-5 space-y-3 text-sm">
            {profile ? (
              <>
                <div>
                  <b>Blood group:</b>{" "}
                  {profile.bloodGroup ||
                    "Not set"}
                </div>

                <div>
                  <b>Allergies:</b>{" "}
                  {(profile.allergies || []).join(
                    ", "
                  ) || "None recorded"}
                </div>

                <div>
                  <b>Conditions:</b>{" "}
                  {(profile.medicalConditions ||
                    []
                  ).join(", ") ||
                    "None recorded"}
                </div>
                  <div><b>Gender:</b> {profile.gender || "Not provided"}</div>
                  <div><b>Date of birth:</b> {profile.dateOfBirth ? String(profile.dateOfBirth).slice(0, 10) : "Not provided"}</div>
                  <div><b>Address:</b> {profile.address || "Not provided"}</div>
                  <div><b>Medical notes:</b> {profile.medicalNotes || "None recorded"}</div>

                <div>
                  <b>Medications:</b>{" "}
                  {(profile.medications || []).join(
                    ", "
                  ) || "None recorded"}
                </div>
              </>
            ) : (
              <div>Loading profile…</div>
            )}
          </div>

          <button
            onClick={() => { setProfileForm(toProfileForm(profile)); setEditingProfile(true); }}
            className="mt-4 rounded-lg border px-3 py-2 text-sm font-bold hover:bg-slate-50"
          >
            Edit Medical Profile
          </button>

          {editingProfile && profileForm && (
            <form onSubmit={saveProfile} className="mt-4 space-y-3 border-t pt-4">
              {[['allergies', 'Allergies'], ['medicalConditions', 'Medical conditions'], ['medications', 'Medications']].map(([key, label]) => (
                <label key={key} className="block text-sm font-bold">{label}
                  <input className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={profileForm[key]} onChange={(event) => setProfileForm({ ...profileForm, [key]: event.target.value })} placeholder="Separate multiple items with commas" />
                </label>
              ))}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-bold">Blood group<select className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={profileForm.bloodGroup} onChange={(event) => setProfileForm({ ...profileForm, bloodGroup: event.target.value })}><option value="">Select blood group</option>{BLOOD_GROUPS.map((group) => <option key={group}>{group}</option>)}</select></label>
                <label className="text-sm font-bold">Gender<input className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={profileForm.gender} onChange={(event) => setProfileForm({ ...profileForm, gender: event.target.value })} /></label>
                <label className="text-sm font-bold">Date of birth<input type="date" className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={profileForm.dateOfBirth} onChange={(event) => setProfileForm({ ...profileForm, dateOfBirth: event.target.value })} /></label>
                <label className="text-sm font-bold">Address<input className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" value={profileForm.address} onChange={(event) => setProfileForm({ ...profileForm, address: event.target.value })} /></label>
              </div>
              <label className="block text-sm font-bold">Medical notes<textarea className="mt-1 w-full rounded-lg border px-3 py-2 font-normal" rows="2" value={profileForm.medicalNotes} onChange={(event) => setProfileForm({ ...profileForm, medicalNotes: event.target.value })} /></label>
              <div className="flex gap-2"><button className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white">Save Profile</button><button type="button" onClick={() => setEditingProfile(false)} className="rounded-lg border px-4 py-2 font-bold">Cancel</button></div>
            </form>
          )}

          {/* Emergency Contacts */}
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-800">
            <b>Emergency contacts</b>

            <div className="mt-2 text-sm">
              {profile?.emergencyContacts?.length ? (
                profile.emergencyContacts.map(
                  (contact) => (
                    <div
                      key={contact._id}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2"><PhoneCall size={14} />{contact.name} · {contact.phone}</span>
                      <span className="flex gap-2"><button type="button" title="Edit contact" onClick={() => { setEditingContact(contact._id); setContactForm(contact); }}><Pencil size={14} /></button><button type="button" title="Delete contact" onClick={() => deleteContact(contact._id)}><Trash2 size={14} /></button></span>
                    </div>
                  )
                )
              ) : (
                <div>
                  No emergency contacts added
                </div>
              )}
            </div>
          </div>

          <button type="button" onClick={() => { setEditingContact(null); setShowContactForm(true); setContactForm({ name: "", relationship: "", phone: "", email: "" }); }} className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold"><Plus size={16} /> Add Emergency Contact</button>
          {(showContactForm || editingContact) && (
            <form onSubmit={saveContact} className="mt-3 space-y-2">
              {['name', 'relationship', 'phone', 'email'].map((key) => <input key={key} required={key === 'name' || key === 'phone'} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder={key[0].toUpperCase() + key.slice(1)} value={contactForm[key]} onChange={(event) => setContactForm({ ...contactForm, [key]: event.target.value })} />)}
              <button className="rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">{editingContact ? "Update Contact" : "Save Contact"}</button>
            </form>
          )}

          {/* Blood Group Editor */}
          {editingBlood ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <select
                value={bloodGroup}
                onChange={(event) =>
                  setBloodGroup(event.target.value)
                }
                className="rounded-lg border px-3 py-2 font-bold"
              >
                <option value="">
                  Select blood group
                </option>

                {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
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
                  setBloodGroup("");
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
                  profile?.bloodGroup || ""
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

      {/* =================================
          Emergency Resource Request
          ================================= */}
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">What type of emergency help do you need?</h2>
            <p className="mt-1 text-sm text-slate-500">Select one or more resources, then search nearby hospitals.</p>
          </div>
          <span className="text-sm font-bold text-slate-500">{resourceSelection.length} selected</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RESOURCE_OPTIONS.map(({ value, label, icon: Icon }) => {
            const selected = resourceSelection.includes(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => setResourceSelection((current) => selected ? current.filter((item) => item !== value) : [...current, value])}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left font-bold ${selected ? "border-red-600 bg-red-50 text-red-700" : "hover:bg-slate-50"}`}
              >
                <Icon size={22} /> {label}
              </button>
            );
          })}
        </div>

        {resourceSelection.length > 0 && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
            Selected: {resourceSelection.map((resource) => RESOURCE_OPTIONS.find((option) => option.value === resource)?.label).join(" + ")}
          </div>
        )}

        <button type="button" onClick={searchHospitals} disabled={searching} className="mt-4 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white disabled:opacity-60">
          {searching ? "Searching..." : "Find Nearby Hospitals"}
        </button>
      </section>

      {/* =================================
          Nearby Hospitals
          ================================= */}
      <section className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-black">
            <MapPinned className="text-red-600" />
            Nearby Hospitals
          </h2>

          <span className="text-sm text-slate-500">
            Ranked by requested resource + capability
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {nearbyHospitals.map((hospital) => (
            <div
              key={hospital._id}
              className="rounded-2xl border p-4"
            >
              <div className="font-bold">
                {hospital.name}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {hospital.distanceKm} km
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-emerald-50 px-2 py-1">
                  Beds {hospital.availableBeds}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  ICU{" "}
                  {hospital.icuAvailable
                    ? "Yes"
                    : "No"}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  O₂{" "}
                  {hospital.oxygenAvailable
                    ? "Yes"
                    : "No"}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-1">
                  Ambulance{" "}
                  {hospital.ambulanceAvailable
                    ? "Yes"
                    : "No"}
                </span>

                {resourceSelection.includes("ANTIVENOM") && (
                  <span className={`rounded-full px-2 py-1 ${hospital.antivenomAvailable && hospital.antivenomUnits > 0 ? "bg-emerald-50" : "bg-red-50"}`}>
                    Antivenom {hospital.antivenomAvailable && hospital.antivenomUnits > 0 ? `Available · ${hospital.antivenomUnits} units` : "Unavailable"}
                  </span>
                )}

                {resourceSelection.includes("BLOOD") && (
                  <span className={`rounded-full px-2 py-1 ${hospital.bloodAvailable ? "bg-emerald-50" : "bg-red-50"}`}>
                    Blood {hospital.bloodAvailable ? `Available · ${profile?.bloodGroup}` : "Unavailable"}
                  </span>
                )}
              </div>

              <button type="button" onClick={() => sendSOS(hospital._id)} className="mt-4 rounded-lg bg-red-600 px-3 py-2 text-sm font-bold text-white">
                Request Help
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* =================================
          Map
          ================================= */}
      {location && (
        <section className="rounded-3xl border bg-white p-4 shadow-sm">
          <MapView
            center={[
              location[1],
              location[0],
            ]}
            patient={location}
            hospitals={nearbyHospitals}
            ambulance={
              activeEmergency?.liveAmbulanceLocation
            }
          />
        </section>
      )}

      {/* =================================
          Active Emergency
          ================================= */}
      {activeEmergency && (
        <section className="rounded-3xl bg-slate-950 p-6 text-white shadow-sm">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            Active emergency
          </div>

          <div className="mt-1 flex items-center justify-between">
            <h2 className="text-2xl font-black">
              #
              {String(activeEmergency._id).slice(
                -8
              )}
            </h2>

            <span className="rounded-full bg-red-600 px-3 py-1 text-sm font-bold">
              {activeEmergency.status}
            </span>
          </div>

          <div className="mt-4 text-slate-300">
            {activeEmergency.hospitalId?.name ||
              "Searching hospitals…"}

            {activeEmergency.ambulanceId
              ?.vehicleNumber
              ? ` · ${activeEmergency.ambulanceId.vehicleNumber}`
              : ""}
          </div>

          {/* Cancel */}
          <button
            onClick={cancelEmergency}
            className="mt-4 rounded-lg border border-white/20 px-3 py-2 text-sm font-bold"
          >
            Cancel emergency
          </button>
        </section>
      )}
    </div>
  );
}