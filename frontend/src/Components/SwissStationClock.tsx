import { useEffect, useMemo, useState } from 'react'

const timeFormatter = new Intl.DateTimeFormat('de-CH', {
  timeZone: 'Europe/Zurich',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const dateFormatter = new Intl.DateTimeFormat('de-CH', {
  timeZone: 'Europe/Zurich',
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

function zurichTimeParts(date: Date) {
  const values = Object.fromEntries(timeFormatter.formatToParts(date).map((part) => [part.type, part.value]))
  return {
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

export default function SwissStationClock() {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = useMemo(() => zurichTimeParts(now), [now])
  const secondAngle = time.second * 6
  const minuteAngle = (time.minute + time.second / 60) * 6
  const hourAngle = ((time.hour % 12) + time.minute / 60 + time.second / 3600) * 30

  return <aside className="station-clock" aria-label={`Aktuelle Zeit in Zürich: ${timeFormatter.format(now)}`}>
    <div className="station-clock__finial" aria-hidden="true" />
    <div className="station-clock__face">
      <div className="station-clock__ticks" aria-hidden="true">
        {Array.from({ length: 60 }, (_, index) => <i className={index % 5 === 0 ? 'hour-tick' : ''} style={{ transform: `rotate(${index * 6}deg)` }} key={index} />)}
      </div>
      <span className="clock-cross" aria-hidden="true" />
      <span className="clock-hand clock-hand--hour" style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }} />
      <span className="clock-hand clock-hand--minute" style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }} />
      <span className="clock-hand clock-hand--second" style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }} />
      <span className="clock-pin" aria-hidden="true" />
    </div>
    <svg className="station-clock__post" viewBox="0 0 180 230" aria-hidden="true">
      <path className="post-shadow" d="M85 0h16v185H85z" />
      <path className="post-light" d="M88 0h5v185h-5z" />
      <path className="post-bracket" d="M93 26c30 0 46 15 46 40 0 18-12 30-28 30-11 0-19-7-19-17 0-8 6-14 14-14 6 0 11 4 11 10" />
      <path className="post-bracket" d="M93 26c-30 0-46 15-46 40 0 18 12 30 28 30 11 0 19-7 19-17 0-8-6-14-14-14-6 0-11 4-11 10" />
      <path className="post-base" d="M60 185h66l9 13H51zM44 198h98v12H44zM31 210h124v13H31z" />
    </svg>
    <div className="station-clock__caption">
      <span>Zürich · Schweiz</span>
      <strong>{timeFormatter.format(now)}</strong>
      <small>{dateFormatter.format(now)}</small>
    </div>
  </aside>
}
