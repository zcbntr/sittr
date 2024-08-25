"use client";
import {
  Calendar,
  dateFnsLocalizer,
  momentLocalizer,
  View,
  Views,
} from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { Children, cloneElement, useMemo, useState } from "react";
import moment from "moment";

const locales = {
  "en-US": enUS,
};

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

export default function CalendarComponent({ ...props }) {
  const [events, setEvents] = useState([
    {
      start: moment(),
      end: moment().add(1, "hours"),
      title: "test",
      allDay: false,
      desc: "test",
    },
  ] as unknown as CalendarEvent[]);

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

  const myEventsList = [
    {
      id: 1,
      title: "All Day Event very long title",
      start: new Date(2024, 8, 25, 10),
      end: new Date(2024, 8, 25, 15),
    },
  ];

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
        defaultDate={new Date(2024, 8, 21)}
        onSelectEvent={(event: CalendarEvent) => alert(event.title)}
        onSelectSlot={handleSelect}
        startAccessor="start"
        endAccessor="end"
        titleAccessor="title"
      />
    </>
  );
}
