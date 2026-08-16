"use client";

import Link from "next/link";
import {
  BedDouble,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hotel,
  IndianRupee,
  Loader2,
  Lock,
  MapPinned,
  PencilLine,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type {
  Booking,
  BookingSimulationResponse,
  CreateBookingRequest,
  CreateItineraryRequest,
  Destination,
  HotelAvailability,
  HotelAvailabilityRoom,
  HotelSearchQuery,
  HotelSearchResponse,
  Itinerary,
  ItineraryStop,
} from "@travelverse/contracts";
import { EmptyStatePanel, ErrorStatePanel } from "@/components/ui/api-state";
import { HydrationSafeIcon } from "@/components/ui/hydration-safe-icon";
import { getCurrentUser } from "@/features/auth/components/auth-api";
import { listDestinations } from "@/features/discovery/components/destination-api";
import { ApiRequestError } from "@/lib/api";
import {
  createBooking,
  createItinerary,
  listBookings,
  listItineraries,
  searchHotels,
} from "./trip-planner-api";

type PlannerFormState = {
  amenity: string;
  checkIn: string;
  checkOut: string;
  destinationSlug: string;
  guests: number;
  minRating: number;
};

type EditableStop = ItineraryStop & {
  id: string;
};

type EditableDay = {
  day: number;
  stops: EditableStop[];
};

type SelectedRoomState = {
  hotel: HotelAvailability;
  room: HotelAvailabilityRoom;
};

const defaultFormState: PlannerFormState = {
  amenity: "",
  checkIn: "2026-08-20",
  checkOut: "2026-08-23",
  destinationSlug: "",
  guests: 2,
  minRating: 0,
};

const amenityOptions = ["wifi", "breakfast", "pool", "bike rental desk", "local tour desk"];

export function TripPlannerExperience() {
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [confirmation, setConfirmation] = useState<BookingSimulationResponse | null>(null);
  const [destinationError, setDestinationError] = useState("");
  const [destinationOptions, setDestinationOptions] = useState<Destination[]>([]);
  const [formState, setFormState] = useState<PlannerFormState>(defaultFormState);
  const [hotelResponse, setHotelResponse] = useState<HotelSearchResponse | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [isDestinationsLoading, setIsDestinationsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isSavingItinerary, setIsSavingItinerary] = useState(false);
  const [isSearchingHotels, setIsSearchingHotels] = useState(false);
  const [itineraryDays, setItineraryDays] = useState<EditableDay[]>([]);
  const [notice, setNotice] = useState("");
  const [savedItineraries, setSavedItineraries] = useState<Itinerary[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<SelectedRoomState | null>(null);
  const [savedItinerary, setSavedItinerary] = useState<Itinerary | null>(null);

  const destination = useMemo(() => {
    return destinationOptions.find((candidate) => candidate.slug === formState.destinationSlug);
  }, [destinationOptions, formState.destinationSlug]);
  const itineraryEstimate = useMemo(() => {
    return itineraryDays.reduce((total, day) => {
      return total + day.stops.reduce((dayTotal, stop) => dayTotal + stop.estimatedCostInr, 0);
    }, 0);
  }, [itineraryDays]);
  const selectedStayTotal = selectedRoom?.room.estimatedTotalInr ?? 0;
  const currentTripTotal = selectedStayTotal + itineraryEstimate;

  useEffect(() => {
    void loadDestinationOptions();
    void loadSavedHistory();
  }, []);

  function updateForm<TField extends keyof PlannerFormState>(
    field: TField,
    value: PlannerFormState[TField],
  ) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));

    if (field === "destinationSlug") {
      const destinationSlug = String(value);
      const nextDestination = destinationOptions.find(
        (candidate) => candidate.slug === destinationSlug,
      );
      setItineraryDays(createTemplateItinerary(nextDestination));
      setSavedItinerary(null);
      setSelectedRoom(null);
      setConfirmation(null);
    }
  }

  async function loadDestinationOptions() {
    setIsDestinationsLoading(true);
    setDestinationError("");

    try {
      const response = await listDestinations({
        limit: 50,
      });
      const publishedDestinations = response.data;
      const firstDestination = publishedDestinations[0];

      setDestinationOptions(publishedDestinations);

      if (!firstDestination) {
        setFormState((current) => ({
          ...current,
          destinationSlug: "",
        }));
        setHotelResponse(null);
        setItineraryDays([]);
        setSelectedRoom(null);
        setDestinationError("No published destinations found. Publish one from admin first.");
        return;
      }

      const selectedSlug = publishedDestinations.some(
        (candidate) => candidate.slug === formState.destinationSlug,
      )
        ? formState.destinationSlug
        : firstDestination.slug;
      const selectedDestination =
        publishedDestinations.find((candidate) => candidate.slug === selectedSlug) ??
        firstDestination;
      const nextFormState = {
        ...formState,
        destinationSlug: selectedDestination.slug,
      };

      setFormState(nextFormState);
      setItineraryDays(createTemplateItinerary(selectedDestination));
      await loadHotelAvailability(nextFormState);
    } catch (error: unknown) {
      setDestinationOptions([]);
      setHotelResponse(null);
      setItineraryDays([]);
      setSelectedRoom(null);
      setDestinationError(error instanceof Error ? error.message : "Unable to load destinations");
    } finally {
      setIsDestinationsLoading(false);
    }
  }

  async function loadHotelAvailability(nextFormState = formState) {
    if (!nextFormState.destinationSlug) {
      setNotice("Please load a published destination before searching stays.");
      return;
    }

    setIsSearchingHotels(true);
    setNotice("");

    try {
      const query: HotelSearchQuery = {
        amenity: nextFormState.amenity || undefined,
        checkIn: nextFormState.checkIn,
        checkOut: nextFormState.checkOut,
        destinationSlug: nextFormState.destinationSlug,
        guests: nextFormState.guests,
        minRating: nextFormState.minRating || undefined,
      };
      const response = await searchHotels(query);
      setHotelResponse(response);
      setSelectedRoom((current) => {
        if (
          current &&
          response.hotels.some((hotel) =>
            hotel.rooms.some(
              (room) =>
                hotel.id === current.hotel.id && room.id === current.room.id && room.isAvailable,
            ),
          )
        ) {
          return current;
        }

        const firstAvailable = findFirstAvailableRoom(response.hotels);
        return firstAvailable;
      });
    } catch (error: unknown) {
      setNotice(error instanceof Error ? error.message : "Unable to load hotels");
      setHotelResponse(null);
      setSelectedRoom(null);
    } finally {
      setIsSearchingHotels(false);
    }
  }

  async function loadSavedHistory() {
    setIsHistoryLoading(true);

    try {
      await getCurrentUser();
      setIsAuthenticated(true);
      const [bookingList, itineraryList] = await Promise.all([listBookings(), listItineraries()]);
      setBookingHistory(bookingList.bookings);
      setSavedItineraries(itineraryList.itineraries);
    } catch {
      setIsAuthenticated(false);
      setBookingHistory([]);
      setSavedItineraries([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function handleHotelSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loadHotelAvailability();
  }

  async function handleSaveItinerary() {
    if (!formState.destinationSlug || itineraryDays.length === 0) {
      setNotice("Please select a published destination before saving an itinerary.");
      return;
    }

    setIsSavingItinerary(true);
    setNotice("");

    try {
      const payload: CreateItineraryRequest = {
        days: itineraryDays.map((day) => ({
          day: day.day,
          stops: day.stops.map((stop) => ({
            estimatedCostInr: stop.estimatedCostInr,
            notes: stop.notes,
            timeOfDay: stop.timeOfDay,
            title: stop.title,
          })),
        })),
        destinationSlug: formState.destinationSlug,
      };
      const itinerary = await createItinerary(payload);
      setSavedItinerary(itinerary);
      setSavedItineraries((current) => [itinerary, ...current]);
      setIsAuthenticated(true);
      setNotice("Itinerary saved to your trip history.");
    } catch (error: unknown) {
      handleProtectedActionError(error, "Login required to save itinerary.");
    } finally {
      setIsSavingItinerary(false);
    }
  }

  async function handleBooking() {
    if (!selectedRoom) {
      setNotice("Pehle available room select karo.");
      return;
    }

    setIsBooking(true);
    setNotice("");

    try {
      const payload: CreateBookingRequest = {
        checkIn: formState.checkIn,
        checkOut: formState.checkOut,
        destinationSlug: formState.destinationSlug,
        guests: formState.guests,
        hotelId: selectedRoom.hotel.id,
        itineraryId: savedItinerary?.id,
        roomId: selectedRoom.room.id,
      };
      const booking = await createBooking(payload);
      setConfirmation(booking);
      setBookingHistory((current) => [booking.booking, ...current]);
      setIsAuthenticated(true);
      setNotice("Simulated booking confirmed.");
      await loadHotelAvailability();
    } catch (error: unknown) {
      handleProtectedActionError(error, "Login required to create simulated booking.");
    } finally {
      setIsBooking(false);
    }
  }

  function handleProtectedActionError(error: unknown, fallbackMessage: string) {
    if (error instanceof ApiRequestError && error.status === 401) {
      setIsAuthenticated(false);
      setNotice(fallbackMessage);
      return;
    }

    setNotice(error instanceof Error ? error.message : fallbackMessage);
  }

  function updateStop(dayIndex: number, stopIndex: number, patch: Partial<EditableStop>) {
    setItineraryDays((current) =>
      current.map((day, currentDayIndex) => {
        if (currentDayIndex !== dayIndex) {
          return day;
        }

        return {
          ...day,
          stops: day.stops.map((stop, currentStopIndex) =>
            currentStopIndex === stopIndex ? { ...stop, ...patch } : stop,
          ),
        };
      }),
    );
  }

  return (
    <main className="award-grain min-h-screen overflow-hidden bg-[#030712] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(45,255,209,0.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(255,125,102,0.17),transparent_30%),linear-gradient(135deg,#030712,#08111e_48%,#030712)]" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link
            className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-sm font-black uppercase tracking-[0.2em] backdrop-blur-xl"
            href="/"
          >
            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-300 text-slate-950">
              TV
            </span>
            TravelVerse
          </Link>
          <nav className="flex flex-wrap gap-2 text-sm text-slate-300">
            {[
              ["Explore", "/explore"],
              ["Transport", "/transport"],
              ["Login", "/login"],
              ["Admin", "/admin"],
            ].map(([label, href]) => (
              <Link
                className="rounded-full px-4 py-2 hover:bg-white/10 hover:text-white"
                href={href}
                key={href}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        <section className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:grid-cols-[0.92fr_1.08fr] lg:p-8">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-teal-200/20 bg-teal-200/10 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
              <HydrationSafeIcon className="h-4 w-4" icon={Sparkles} />
              Day 10 trip planner
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(2.5rem,7vw,6.3rem)] font-black leading-[0.86] tracking-[-0.08em]">
              Pick the stay.
              <span className="block bg-gradient-to-r from-teal-200 via-amber-100 to-orange-300 bg-clip-text text-transparent">
                Build the days.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              Search simulated hotel availability, edit a day-wise itinerary, estimate trip cost and
              create a safe booking simulation after login.
            </p>
          </div>

          <form className="grid gap-3 self-end" onSubmit={handleHotelSearch}>
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField
                disabled={isDestinationsLoading || destinationOptions.length === 0}
                label="Destination"
                onChange={(value) => updateForm("destinationSlug", value)}
                value={formState.destinationSlug}
              >
                <option value="">
                  {isDestinationsLoading ? "Loading published destinations" : "Select destination"}
                </option>
                {destinationOptions.map((candidate) => (
                  <option key={candidate.slug} value={candidate.slug}>
                    {candidate.name}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Amenity"
                onChange={(value) => updateForm("amenity", value)}
                value={formState.amenity}
              >
                <option value="">Any amenity</option>
                {amenityOptions.map((amenity) => (
                  <option key={amenity} value={amenity}>
                    {toTitle(amenity)}
                  </option>
                ))}
              </SelectField>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <DateField
                label="Check-in"
                onChange={(value) => updateForm("checkIn", value)}
                value={formState.checkIn}
              />
              <DateField
                label="Check-out"
                onChange={(value) => updateForm("checkOut", value)}
                value={formState.checkOut}
              />
              <NumberField
                label="Guests"
                max={12}
                min={1}
                onChange={(value) => updateForm("guests", value)}
                value={formState.guests}
              />
            </div>

            <button
              className="inline-flex items-center justify-center gap-3 rounded-[1.45rem] bg-teal-200 px-5 py-4 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-2xl shadow-teal-950/30 transition hover:-translate-y-1 hover:bg-white disabled:opacity-60"
              disabled={isSearchingHotels || isDestinationsLoading || !formState.destinationSlug}
              type="submit"
            >
              {isSearchingHotels ? (
                <HydrationSafeIcon className="h-4 w-4 animate-spin" icon={Loader2} />
              ) : (
                <HydrationSafeIcon className="h-4 w-4" icon={Hotel} />
              )}
              Search stays
            </button>
          </form>
        </section>

        {notice ? (
          <div className="rounded-3xl border border-amber-200/20 bg-amber-200/10 px-5 py-4 text-sm text-amber-50">
            {notice}
            {!isAuthenticated ? (
              <Link className="ml-2 font-black text-teal-100 underline" href="/login">
                Login here
              </Link>
            ) : null}
          </div>
        ) : null}

        {destinationError ? (
          <ErrorStatePanel
            message={destinationError}
            onRetry={loadDestinationOptions}
            title="Unable to load published destinations"
          />
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.72fr)]">
          <div className="grid gap-6">
            <HotelResults
              hasDestination={Boolean(formState.destinationSlug)}
              hotelResponse={hotelResponse}
              isLoading={isSearchingHotels}
              onSelectRoom={setSelectedRoom}
              onRetry={() => loadHotelAvailability()}
              selectedRoom={selectedRoom}
            />
            <ItineraryEditor
              destinationName={destination?.name ?? "Destination"}
              estimate={itineraryEstimate}
              isSaving={isSavingItinerary}
              onSave={handleSaveItinerary}
              onUpdateStop={updateStop}
              savedItinerary={savedItinerary}
              days={itineraryDays}
            />
          </div>

          <aside className="grid gap-6 self-start">
            <BookingSummary
              confirmation={confirmation}
              currentTripTotal={currentTripTotal}
              isBooking={isBooking}
              itineraryEstimate={itineraryEstimate}
              onBook={handleBooking}
              selectedRoom={selectedRoom}
              stayTotal={selectedStayTotal}
            />
            <SavedTripsPanel
              bookings={bookingHistory}
              isAuthenticated={isAuthenticated}
              isLoading={isHistoryLoading}
              itineraries={savedItineraries}
            />
          </aside>
        </section>
      </section>
    </main>
  );
}

function HotelResults({
  hasDestination,
  hotelResponse,
  isLoading,
  onSelectRoom,
  onRetry,
  selectedRoom,
}: {
  hasDestination: boolean;
  hotelResponse: HotelSearchResponse | null;
  isLoading: boolean;
  onSelectRoom: (room: SelectedRoomState) => void;
  onRetry: () => void;
  selectedRoom: SelectedRoomState | null;
}) {
  if (isLoading) {
    return (
      <section className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div className="h-64 animate-pulse rounded-[2rem] bg-white/[0.06]" key={index} />
        ))}
      </section>
    );
  }

  if (!hotelResponse) {
    return (
      <EmptyStatePanel
        action={
          hasDestination ? (
            <button
              className="rounded-full bg-teal-300 px-5 py-3 text-sm font-black text-slate-950"
              onClick={onRetry}
              type="button"
            >
              Load stays
            </button>
          ) : null
        }
        message={
          hasDestination
            ? "Search latest simulated hotel availability for the selected published destination."
            : "Published destination data is required before hotel availability can be checked."
        }
        title="Hotel availability will appear here"
      />
    );
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-200">
            Simulated availability
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
            {hotelResponse.hotels.length} stay option{hotelResponse.hotels.length === 1 ? "" : "s"}
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-300">
          {hotelResponse.nights} night(s), {hotelResponse.guests} guest(s)
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {hotelResponse.hotels.map((hotel) => (
          <article
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl"
            key={hotel.id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-teal-200/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-teal-100">
                  <HydrationSafeIcon className="h-3.5 w-3.5" icon={MapPinned} />
                  {hotel.pricingMode}
                </p>
                <h3 className="mt-3 text-2xl font-black tracking-[-0.05em]">{hotel.name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{hotel.address}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-sm font-black text-amber-100">
                <HydrationSafeIcon className="h-4 w-4" icon={Star} />
                {hotel.rating.toFixed(1)}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {hotel.amenities.map((amenity) => (
                <span
                  className="rounded-full border border-white/10 bg-slate-950/45 px-3 py-1 text-xs text-slate-300"
                  key={amenity}
                >
                  {toTitle(amenity)}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-3">
              {hotel.rooms.map((room) => {
                const isSelected =
                  selectedRoom?.hotel.id === hotel.id && selectedRoom.room.id === room.id;

                return (
                  <button
                    className={[
                      "rounded-2xl border p-4 text-left transition",
                      isSelected
                        ? "border-teal-200/70 bg-teal-200/10"
                        : "border-white/10 bg-slate-950/50 hover:border-teal-200/35",
                      !room.isAvailable ? "cursor-not-allowed opacity-55" : "",
                    ].join(" ")}
                    disabled={!room.isAvailable}
                    key={room.id}
                    onClick={() => onSelectRoom({ hotel, room })}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-black text-white">{room.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Capacity {room.capacity} • {room.amenities.map(toTitle).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-teal-100">
                          {formatInr(room.estimatedTotalInr)}
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                          {room.isAvailable ? "Available" : room.unavailableReason}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {hotelResponse.warnings.map((warning) => (
        <p
          className="rounded-2xl border border-amber-200/20 bg-amber-200/10 px-4 py-3 text-sm text-amber-50"
          key={warning}
        >
          {warning}
        </p>
      ))}
    </section>
  );
}

function ItineraryEditor({
  days,
  destinationName,
  estimate,
  isSaving,
  onSave,
  onUpdateStop,
  savedItinerary,
}: {
  days: EditableDay[];
  destinationName: string;
  estimate: number;
  isSaving: boolean;
  onSave: () => void;
  onUpdateStop: (dayIndex: number, stopIndex: number, patch: Partial<EditableStop>) => void;
  savedItinerary: Itinerary | null;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
            <HydrationSafeIcon className="h-4 w-4" icon={PencilLine} />
            Itinerary editor
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
            {destinationName} day plan
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-950/45 px-4 py-2 text-sm font-black text-teal-100">
          {formatInr(estimate)}
        </span>
      </div>

      <div className="mt-5 grid gap-4">
        {days.map((day, dayIndex) => (
          <div
            className="rounded-[1.6rem] border border-white/10 bg-slate-950/45 p-4"
            key={day.day}
          >
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-slate-400">
              Day {day.day}
            </p>
            <div className="grid gap-3">
              {day.stops.map((stop, stopIndex) => (
                <div
                  className="grid gap-3 rounded-2xl bg-white/[0.04] p-3 md:grid-cols-[1fr_1fr_120px]"
                  key={stop.id}
                >
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-200/60"
                    onChange={(event) =>
                      onUpdateStop(dayIndex, stopIndex, { title: event.target.value })
                    }
                    value={stop.title}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-200/60"
                    onChange={(event) =>
                      onUpdateStop(dayIndex, stopIndex, { notes: event.target.value })
                    }
                    value={stop.notes}
                  />
                  <input
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-teal-200/60"
                    min={0}
                    onChange={(event) =>
                      onUpdateStop(dayIndex, stopIndex, {
                        estimatedCostInr: Number(event.target.value),
                      })
                    }
                    type="number"
                    value={stop.estimatedCostInr}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
        disabled={isSaving || days.length === 0}
        onClick={onSave}
        type="button"
      >
        {isSaving ? (
          <HydrationSafeIcon className="h-4 w-4 animate-spin" icon={Loader2} />
        ) : (
          <HydrationSafeIcon className="h-4 w-4" icon={ClipboardList} />
        )}
        {savedItinerary ? "Save another itinerary version" : "Save itinerary"}
      </button>
    </section>
  );
}

function BookingSummary({
  confirmation,
  currentTripTotal,
  isBooking,
  itineraryEstimate,
  onBook,
  selectedRoom,
  stayTotal,
}: {
  confirmation: BookingSimulationResponse | null;
  currentTripTotal: number;
  isBooking: boolean;
  itineraryEstimate: number;
  onBook: () => void;
  selectedRoom: SelectedRoomState | null;
  stayTotal: number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
        <HydrationSafeIcon className="h-4 w-4" icon={IndianRupee} />
        Booking simulation
      </p>
      <h2 className="mt-3 text-4xl font-black tracking-[-0.07em]">{formatInr(currentTripTotal)}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Stay estimate + editable itinerary estimate. Transport can be compared separately.
      </p>

      <div className="mt-5 grid gap-2">
        <SummaryRow label="Selected stay" value={formatInr(stayTotal)} />
        <SummaryRow label="Itinerary activities" value={formatInr(itineraryEstimate)} />
      </div>

      {selectedRoom ? (
        <div className="mt-5 rounded-2xl border border-teal-200/20 bg-teal-200/10 p-4 text-sm leading-6 text-teal-50">
          <p className="font-black">{selectedRoom.hotel.name}</p>
          <p>
            {selectedRoom.room.name} • {formatInr(selectedRoom.room.estimatedTotalInr)}
          </p>
        </div>
      ) : (
        <p className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
          Select an available room to create a simulated booking.
        </p>
      )}

      <button
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-white disabled:opacity-60"
        disabled={isBooking || !selectedRoom}
        onClick={onBook}
        type="button"
      >
        {isBooking ? (
          <HydrationSafeIcon className="h-4 w-4 animate-spin" icon={Loader2} />
        ) : (
          <HydrationSafeIcon className="h-4 w-4" icon={CheckCircle2} />
        )}
        Create simulated booking
      </button>

      {confirmation ? (
        <div className="mt-5 rounded-2xl border border-emerald-200/20 bg-emerald-200/10 p-4 text-sm leading-6 text-emerald-50">
          <p className="font-black">Booking confirmed: {confirmation.booking.id}</p>
          <p>
            {confirmation.hotel.name} • {confirmation.room.name} •{" "}
            {formatInr(confirmation.booking.estimatedTotalInr)}
          </p>
        </div>
      ) : null}
    </section>
  );
}

function SavedTripsPanel({
  bookings,
  isAuthenticated,
  isLoading,
  itineraries,
}: {
  bookings: Booking[];
  isAuthenticated: boolean;
  isLoading: boolean;
  itineraries: Itinerary[];
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-teal-100">
        <HydrationSafeIcon className="h-4 w-4" icon={BedDouble} />
        Saved trips
      </p>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-400">Checking your session...</p>
      ) : !isAuthenticated ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
          <HydrationSafeIcon className="mb-3 h-5 w-5 text-amber-200" icon={Lock} />
          Login ke baad saved itineraries aur booking history yahin dikhegi.
        </div>
      ) : (
        <div className="mt-4 grid gap-4">
          <HistoryBlock count={itineraries.length} label="Saved itinerary version(s)" />
          <HistoryBlock count={bookings.length} label="Simulated booking(s)" />
          {bookings.slice(0, 3).map((booking) => (
            <div
              className="rounded-2xl border border-white/10 bg-slate-950/50 p-4"
              key={booking.id}
            >
              <p className="text-sm font-black text-white">{booking.destinationSlug}</p>
              <p className="mt-1 text-xs text-slate-400">
                {formatIsoDate(booking.checkIn)} → {formatIsoDate(booking.checkOut)} •{" "}
                {formatInr(booking.estimatedTotalInr)}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SelectField({
  children,
  disabled = false,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">{label}</span>
      <select
        className="bg-transparent text-sm font-bold text-white outline-none disabled:opacity-60"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  );
}

function DateField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5" icon={CalendarDays} />
        {label}
      </span>
      <input
        className="bg-transparent text-sm font-bold text-white outline-none"
        onChange={(event) => onChange(event.target.value)}
        type="date"
        value={value}
      />
    </label>
  );
}

function NumberField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}) {
  return (
    <label className="grid gap-2 rounded-[1.4rem] border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
        <HydrationSafeIcon className="h-3.5 w-3.5" icon={Users} />
        {label}
      </span>
      <input
        className="bg-transparent text-sm font-bold text-white outline-none"
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.target.value))}
        type="number"
        value={value}
      />
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-black text-white">{value}</span>
    </div>
  );
}

function HistoryBlock({ count, label }: { count: number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
      <p className="text-2xl font-black text-white">{count}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
    </div>
  );
}

function createTemplateItinerary(destination?: Destination): EditableDay[] {
  const attractions = destination?.attractions ?? [];

  return [
    {
      day: 1,
      stops: [
        createStop(
          "morning",
          attractions[0]?.name ?? "Arrival walk",
          "Start with the signature place.",
          700,
        ),
        createStop(
          "evening",
          destination?.foodHighlights[0] ?? "Local dinner",
          "Food trail and market time.",
          900,
        ),
      ],
    },
    {
      day: 2,
      stops: [
        createStop(
          "morning",
          attractions[1]?.name ?? "Culture block",
          "Keep the deeper history slot here.",
          800,
        ),
        createStop(
          "evening",
          destination?.danceAndArts[0] ?? "Local art",
          "Catch performance/craft culture.",
          1000,
        ),
      ],
    },
    {
      day: 3,
      stops: [
        createStop(
          "morning",
          destination?.festivals[0] ?? "Slow morning",
          "Flexible buffer and final photos.",
          600,
        ),
      ],
    },
  ];
}

function createStop(
  timeOfDay: ItineraryStop["timeOfDay"],
  title: string,
  notes: string,
  estimatedCostInr: number,
): EditableStop {
  return {
    estimatedCostInr,
    id: `${timeOfDay}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    notes,
    timeOfDay,
    title,
  };
}

function findFirstAvailableRoom(hotels: HotelAvailability[]): SelectedRoomState | null {
  for (const hotel of hotels) {
    const room = hotel.rooms.find((candidateRoom) => candidateRoom.isAvailable);

    if (room) {
      return {
        hotel,
        room,
      };
    }
  }

  return null;
}

function formatInr(value: number) {
  return `₹${Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatIsoDate(value: string) {
  return value.slice(0, 10);
}

function toTitle(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}
