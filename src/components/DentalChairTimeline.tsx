import React from 'react';
import {
  Clock,
  User,
  Phone,
  Plus,
  Stethoscope,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  AppointmentItem,
  CHAIRS,
  findTreatment
} from '../data/dentalData';

interface DentalChairTimelineProps {
  appointments: AppointmentItem[];
  selectedItem: AppointmentItem | null;
  setSelectedItem: (item: AppointmentItem | null) => void;
  getBadgeStyle: (status: string) => { bg: string; color: string };
  onAddAppointmentForChair: (chair: string) => void;
}

export default function DentalChairTimeline({
  appointments,
  selectedItem,
  setSelectedItem,
  getBadgeStyle,
  onAddAppointmentForChair
}: DentalChairTimelineProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-100 overflow-hidden border-r-2 border-slate-300">
      <div className="p-3.5 bg-white border-b-2 border-slate-300 flex items-center justify-between shadow-xs">
        <div>
          <h2 className="font-bold text-sm text-slate-950 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            Sơ đồ điều phối theo ghế nha khoa & phòng điều trị
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            Xem tải làm việc và điều phối bệnh nhân theo từng ghế khám
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 h-full min-h-[500px]">
          {CHAIRS.map((chairName, index) => {
            const chairAppointments = appointments
              .filter((a) => (a.chair || CHAIRS[0]) === chairName)
              .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

            return (
              <div
                key={chairName}
                className="bg-white rounded-2xl border-2 border-slate-300 shadow-xs flex flex-col overflow-hidden"
              >
                {/* Clean Chair Header */}
                <div className="p-3 bg-slate-100 border-b-2 border-slate-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      #{index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-950 leading-tight">
                        {chairName}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-600">
                        {chairAppointments.length} ca khám
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddAppointmentForChair(chairName)}
                    className="p-1 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
                    title={`Thêm ca vào ${chairName}`}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Chair Appointments List */}
                <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
                  {chairAppointments.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                      <span className="font-medium">Ghế đang trống</span>
                      <button
                        type="button"
                        onClick={() => onAddAppointmentForChair(chairName)}
                        className="mt-1.5 text-blue-600 font-semibold hover:underline"
                      >
                        + Xếp lịch vào ghế này
                      </button>
                    </div>
                  ) : (
                    chairAppointments.map((item) => {
                      const isSelected = selectedItem?.id === item.id;
                      const statusStyle = getBadgeStyle(item.status);
                      const treatment = findTreatment(item.serviceCode);

                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedItem(item)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-100/90 border-2 border-blue-600 shadow-sm'
                              : 'bg-white hover:bg-slate-100 border border-slate-300 shadow-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1">
                              <Clock size={12} className="text-blue-600" />
                              {item.time} - {item.endTime}
                            </span>
                            <span
                              style={{
                                backgroundColor: statusStyle.bg,
                                color: statusStyle.color
                              }}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-slate-800">
                            {item.name}
                          </div>

                          <div className="text-[11px] text-blue-700 font-semibold mt-0.5 truncate">
                            {treatment?.name || item.serviceCode}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                            <span>{item.doctor}</span>
                            {item.tooth && (
                              <span className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-mono font-bold text-[10px]">
                                R: {item.tooth}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
