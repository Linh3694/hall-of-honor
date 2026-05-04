import { useEffect, useRef } from "react";

type RecordLike = {
  _id?: unknown;
  students?: Array<{ student?: { _id?: unknown } }>;
};

type StudentEntry = NonNullable<RecordLike["students"]>[number];

/* eslint-disable no-unused-vars -- Call signature chỉ phục vụ typings TypeScript */
interface ScholarshipDeepLinkOpen {
  (record: RecordLike, student: StudentEntry): void;
}
/* eslint-enable no-unused-vars */

/**
 * Mở modal học bổng khi URL có recordId + studentId (đồng bộ deep link).
 */
export function useScholarshipDeepLink({
  recordIdParam,
  studentIdParam,
  records,
  onOpen,
}: {
  recordIdParam?: string;
  studentIdParam?: string;
  records: RecordLike[];
  onOpen: ScholarshipDeepLinkOpen;
}) {
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  useEffect(() => {
    if (!recordIdParam || !studentIdParam || !records.length) return;

    const rid = String(recordIdParam);
    const sid = String(studentIdParam);
    if (rid === "undefined" || sid === "undefined") return;

    const foundRecord = records.find((r) => String(r._id) === rid);
    if (!foundRecord) return;

    const foundStudent = foundRecord.students?.find((stu) => {
      const id = stu.student?._id;
      return id != null && String(id) === sid;
    });
    if (!foundStudent) return;

    onOpenRef.current(foundRecord, foundStudent);
  }, [recordIdParam, studentIdParam, records]);
}
