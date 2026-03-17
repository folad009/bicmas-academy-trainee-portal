import { useEffect, useMemo, useState } from "react";
import { Award, Download } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { CertificateModal } from "@/components/CertificateModal";
import { useDashboard } from "@/hooks/useDashboard";
import { useAuth } from "@/context/AuthContext";
import { Course, CourseStatus } from "@/types";

export default function CertificatesPage() {
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCertificate, setSelectedCertificate] = useState<Course | null>(null);

  const completedCourses = useMemo(
    () =>
      (data?.courses ?? []).filter(
        (course) => course.status === CourseStatus.Completed,
      ),
    [data?.courses],
  );

  const requestedCourseId = searchParams.get("course");

  useEffect(() => {
    if (!requestedCourseId || selectedCertificate) return;

    const requestedCourse = completedCourses.find(
      (course) => course.id === requestedCourseId,
    );

    if (requestedCourse) {
      setSelectedCertificate(requestedCourse);
    }
  }, [completedCourses, requestedCourseId, selectedCertificate]);

  const handleCloseModal = () => {
    setSelectedCertificate(null);
    if (requestedCourseId) {
      setSearchParams({});
    }
  };

  if (!user) return null;

  if (isLoading) {
    return <div className="p-10 text-center text-slate-500">Loading certificates...</div>;
  }

  if (isError) {
    return (
      <div className="p-10 text-center text-slate-500">
        We could not load your certificates right now.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Your Certificates</h2>
          <p className="mt-2 text-slate-500">
            Download certificates for every completed course.
          </p>
        </div>

        {!completedCourses.length ? (
          <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-slate-500 shadow-sm">
            Complete a course to unlock your first certificate.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <Award size={14} />
                      Completed
                    </div>
                    <h3 className="mt-4 text-lg font-bold text-slate-900">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      {course.description}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCertificate(course)}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#008080] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006d6d]"
                >
                  <Download size={16} />
                  Download Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <CertificateModal
        isOpen={!!selectedCertificate}
        onClose={handleCloseModal}
        onConfirm={handleCloseModal}
        courseTitle={selectedCertificate?.title ?? ""}
        recipientName={user.name}
        certificateUrl={selectedCertificate?.certificateUrl}
      />
    </>
  );
}
