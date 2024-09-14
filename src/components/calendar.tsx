"use client";
import { Calendar, momentLocalizer, type View } from "react-big-calendar";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useEffect, useState } from "react";
import moment from "moment";
import { getSittingRequestsInRange } from "~/server/queries";
import { endOfMonth, startOfMonth } from "date-fns";

const allViews: View[] = ["agenda", "day", "week", "month"];

const localizer = momentLocalizer(moment);

class CalendarEvent {
  title: string;
  allDay: boolean;
  start: Date;
  end: Date;
  desc: string;
  resourceId?: string;
  tooltip?: string;

  constructor(
    _title: string,
    _start: Date,
    _endDate: Date,
    _allDay?: boolean,
    _desc?: string,
    _resourceId?: string,
  ) {
    this.title = _title;
    this.allDay = _allDay ?? false;
    this.start = _start;
    this.end = _endDate;
    this.desc = _desc ?? "";
    this.resourceId = _resourceId;
  }
}

export default function CalendarComponent() {
  // TODO
  // Get events from database
  // Set events from database to the state

  const [events, setEvents] = useState([
    {
      start: moment(),
      end: moment().add(1, "hours"),
      title: "test",
      allDay: false,
      desc: "test",
    },
  ] as unknown as CalendarEvent[]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetch("api/sittingrequest", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: startOfMonth(new Date()),
            to: endOfMonth(new Date()),
          }),
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const events = result.map((event) => {
          return {
            title: event.category,
            start: new Date(event.startDate),
            end: new Date(event.endDate),
            allDay: false,
            desc: "",
          };
        });
        setEvents(events);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleSelect = ({ start, end }) => {
    const title = window.prompt("New Event name");

    if (title) {
      const newEvent = {} as CalendarEvent;
      newEvent.start = moment(start).toDate();
      newEvent.end = moment(end).toDate();
      newEvent.title = title;

      setEvents([...events, newEvent]);
    }
  };

  return (
    <>
      <div>
        <strong>
          Click an event to see more info, or drag the mouse over the calendar
          to select a date/time range.
        </strong>
      </div>
      <Calendar
        selectable
        localizer={localizer}
        events={events}
        defaultView="month"
        views={allViews}
        defaultDate={new Date()}
        onSelectEvent={(event: CalendarEvent) => alert(event.title)}
        onSelectSlot={handleSelect}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
      />
    </>
  );
}
