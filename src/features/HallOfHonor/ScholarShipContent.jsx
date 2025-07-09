import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL, BASE_URL, CDN_URL } from "../../core/config";
import {
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaQuoteLeft,
  FaTimes,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { BiSolidQuoteLeft } from "react-icons/bi";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";

const ScholarShipContent = ({
  categoryId,
  categoryName,
  recordIdParam,
  studentIdParam,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  // --- States cho dữ liệu API ---
  const [categories, setCategories] = useState([]);
  const [records, setRecords] = useState([]);
  const [schoolYears, setSchoolYears] = useState([]);

  // --- States cho giao diện lọc ---
  const [selectedSchoolYearId, setSelectedSchoolYearId] = useState("");
  const [selectedSubAwardLabel, setSelectedSubAwardLabel] = useState("");
  const [searchName, setSearchName] = useState("");
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // State cho Modal
  const [showModal, setShowModal] = useState(false);
  const [modalRecord, setModalRecord] = useState(null); // record được chọn
  const [modalStudent, setModalStudent] = useState(null); // student được chọn
  const [openLevel, setOpenLevel] = useState(null);

  // Tự động mở modal khi URL chứa recordId & studentId (sau khi states đã khởi tạo)
  useEffect(() => {
    if (!recordIdParam || !studentIdParam || !records.length) return;

    const foundRecord = records.find((r) => r._id === recordIdParam);
    if (!foundRecord) return;

    const foundStudent = foundRecord.students.find(
      (stu) => stu.student?._id === studentIdParam
    );
    if (!foundStudent) return;

    setModalRecord(foundRecord);
    setModalStudent(foundStudent);
    setShowModal(true);
  }, [recordIdParam, studentIdParam, records]);

  // Thêm mảng màu sắc cho các priority
  const priorityColors = [
    "#002855", // Priority 1 - Màu xanh đậm (Đại sứ)
    "#FF4D00", // Priority 2 - Màu cam (Danh dự)
    "#0066A6", // Priority 3 - Màu xanh biển (Khát vọng)
    "#FF6B00", // Priority 4 - Màu cam đỏ (Ươm mầm)
    "#FF8C00", // Priority 5 - Màu cam sáng (Hạnh phúc)
    "#006F8C", // Priority 6 - Màu xanh ngọc (Khởi đầu)
    "#B4D902", // Priority 7 - Màu xanh lá (Ý tưởng)
    "#002147", // Priority 8 - Màu xanh đen (Hành trình)
  ];

  // Lấy thông tin chi tiết của danh mục hiện tại từ API
  const currentCategory =
    categories.find((cat) => cat._id === categoryId) || {};

  // -----------------------------
  // 1) Lấy dữ liệu từ server
  // -----------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, recordsRes, schoolYearsRes] = await Promise.all([
          axios.get(`${API_URL}/award-categories`),
          axios.get(`${API_URL}/award-records`),
          axios.get(`${API_URL}/school-years`),
        ]);

        // Handle both response formats: direct array or {data: array}
        let categoriesData;
        if (Array.isArray(categoriesRes.data)) {
          categoriesData = categoriesRes.data;
        } else if (
          categoriesRes.data.data &&
          Array.isArray(categoriesRes.data.data)
        ) {
          categoriesData = categoriesRes.data.data;
        } else {
          categoriesData = [];
        }

        let recordsData;
        if (Array.isArray(recordsRes.data)) {
          recordsData = recordsRes.data;
        } else if (
          recordsRes.data.data &&
          Array.isArray(recordsRes.data.data)
        ) {
          recordsData = recordsRes.data.data;
        } else {
          recordsData = [];
        }

        let schoolYearsData;
        if (Array.isArray(schoolYearsRes.data)) {
          schoolYearsData = schoolYearsRes.data;
        } else if (
          schoolYearsRes.data.data &&
          Array.isArray(schoolYearsRes.data.data)
        ) {
          schoolYearsData = schoolYearsRes.data.data;
        } else {
          schoolYearsData = [];
        }

        setCategories(categoriesData);
        setRecords(recordsData);
        setSchoolYears(schoolYearsData);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchData();
  }, [API_URL]);

  // -----------------------------
  // 2) Thiết lập mặc định view cho danh mục theo subAward custom
  // -----------------------------

  useEffect(() => {
    if (currentCategory.subAwards?.length > 0 && !selectedSubAwardLabel) {
      const defaultSubAward = currentCategory.subAwards.find(
        (sub) => sub.type === "custom"
      );
      if (defaultSubAward) {
        setSelectedSubAwardLabel(defaultSubAward.label);
      }
    }
  }, [currentCategory.subAwards, selectedSubAwardLabel]);

  useEffect(() => {
    if (!selectedSchoolYearId) return;

    const filteredSubAwards = currentCategory.subAwards?.filter(
      (sub) =>
        sub.type === "custom" && String(sub.schoolYear) === selectedSchoolYearId
    );

    if (filteredSubAwards?.length > 0) {
      const currentLabelExists = filteredSubAwards.some(
        (sub) => sub.label === selectedSubAwardLabel
      );
      if (!currentLabelExists) {
        setSelectedSubAwardLabel(filteredSubAwards[0].label);
      }
    } else {
      setSelectedSubAwardLabel("");
    }
  }, [selectedSchoolYearId, currentCategory.subAwards, selectedSubAwardLabel]);

  // -----------------------------
  // 3) Tính toán danh sách năm học liên quan dựa trên record có subAward type "custom"
  // -----------------------------
  const distinctSchoolYearIds = [
    ...new Set(
      (currentCategory.subAwards || [])
        .filter((sub) => sub.type === "custom" && sub.schoolYear)
        .map((sub) => String(sub.schoolYear))
    ),
  ];
  const relevantSchoolYears = schoolYears.filter((sy) =>
    distinctSchoolYearIds.includes(String(sy._id))
  );

  // Display school years: if no relevant ones found, show all
  const displaySchoolYears =
    relevantSchoolYears.length > 0 ? relevantSchoolYears : schoolYears;

  // -----------------------------
  // 4) Lọc record theo subAward custom, năm học và tên học sinh
  // -----------------------------

  const validLabels = new Set(
    (currentCategory.subAwards || [])
      .filter((s) => s.type === "custom")
      .map((s) => s.label)
  );

  const filteredBaseRecords = records.filter(
    (r) =>
      r.awardCategory?._id === categoryId &&
      r.subAward?.type === "custom" &&
      validLabels.has(r.subAward?.label) && // <── dòng mới
      String(r.subAward.schoolYear) === selectedSchoolYearId
  );

  // Hàm normalize để tìm kiếm không phân biệt dấu và chữ hoa thường
  function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function normalize(str) {
    return removeDiacritics(str)
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const filteredSearchRecords = !searchName.trim()
    ? filteredBaseRecords
    : filteredBaseRecords.reduce((acc, record) => {
        const searchTerm = normalize(searchName.trim());
        const filteredStudents = record.students.filter((stu) =>
          normalize(stu.student?.name || "").includes(searchTerm)
        );
        if (filteredStudents.length > 0) {
          acc.push({ ...record, students: filteredStudents });
        }
        return acc;
      }, []);

  // Nhóm records theo subAward và thêm thông tin priority
  const groupedRecords = filteredSearchRecords.reduce((acc, record) => {
    const label = record.subAward?.label || "Unknown";
    // Determine priority: first from CATEGORY (đã được admin cập nhật),
    // sau đó tới priority còn lưu trong RECORD, cuối cùng tới thứ tự xuất hiện
    const catSub = currentCategory.subAwards?.find(
      (sub) => sub.type === "custom" && sub.label === label
    );
    let prio = catSub?.priority; // ① lấy trực tiếp từ category
    if (!prio) {
      // ② fallback sang record cũ nếu chưa có
      prio = record.subAward?.priority;
    }
    if (!prio) {
      // ③ cuối cùng fallback theo thứ tự
      const idx = currentCategory.subAwards?.findIndex(
        (sub) => sub.type === "custom" && sub.label === label
      );
      prio = idx >= 0 ? idx + 1 : 0;
    }
    if (!prio) {
      const idx = currentCategory.subAwards?.findIndex(
        (sub) => sub.type === "custom" && sub.label === label
      );
      prio = idx >= 0 ? idx + 1 : 0;
    }
    if (!acc[label]) {
      acc[label] = {
        records: [],
        priority: prio,
      };
    }
    acc[label].records.push(record);
    return acc;
  }, {});

  // Chuyển đổi thành mảng và sắp xếp
  const sortedGroups = Object.entries(groupedRecords)
    .map(([label, data]) => ({
      subAwardLabel: label,
      recordsGroup: data.records,
      priority: data.priority,
      hasData: data.records.some((record) => record.students.length > 0),
    }))
    .sort((a, b) => {
      // Nếu cả hai đều có dữ liệu hoặc đều không có dữ liệu, sắp xếp theo priority
      if (a.hasData === b.hasData) {
        return a.priority - b.priority;
      }
      // Ưu tiên nhóm có dữ liệu lên trước
      return b.hasData ? 1 : -1;
    });

  // Thêm useEffect để xử lý search
  useEffect(() => {
    if (!searchName.trim()) {
      setExpandedGroups(new Set());
      return;
    }

    const searchTerm = searchName.toLowerCase().trim();
    const newGroupsToExpand = new Set();

    sortedGroups.forEach((group) => {
      const hasMatch = group.recordsGroup.some((record) => {
        const studentMatch = record.students?.some((student) => {
          const studentData = student.student;
          return (
            studentData?.name?.toLowerCase().includes(searchTerm) ||
            studentData?.studentCode?.toLowerCase().includes(searchTerm) ||
            (student.keyword || []).some((k) =>
              k.toLowerCase().includes(searchTerm)
            ) ||
            (student.keywordEng || []).some((k) =>
              k.toLowerCase().includes(searchTerm)
            ) ||
            (student.activity || []).some((a) =>
              a.toLowerCase().includes(searchTerm)
            ) ||
            (student.activityEng || []).some((a) =>
              a.toLowerCase().includes(searchTerm)
            ) ||
            (student.note || "").toLowerCase().includes(searchTerm) ||
            (student.noteEng || "").toLowerCase().includes(searchTerm)
          );
        });

        const classMatch = record.awardClasses?.some((awardClass) => {
          return (
            awardClass.class?.className?.toLowerCase().includes(searchTerm) ||
            (awardClass.note || "").toLowerCase().includes(searchTerm) ||
            (awardClass.noteEng || "").toLowerCase().includes(searchTerm)
          );
        });

        return studentMatch || classMatch;
      });

      if (hasMatch) {
        newGroupsToExpand.add(group.subAwardLabel);
      }
    });

    setExpandedGroups(newGroupsToExpand);
  }, [searchName, JSON.stringify(sortedGroups)]);

  // -----------------------------
  // 5) Các hàm xử lý mở/đóng Modal và hiển thị thông tin
  // -----------------------------
  const handleOpenModal = (record, student) => {
    setModalRecord(record);
    setModalStudent(student);
    setShowModal(true);
    navigate(
      `/detail/${categoryName}/student/${record._id}/${student.student?._id}`
    );
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalRecord(null);
    setModalStudent(null);
    navigate(`/detail/${categoryName}`);
  };

  // Hàm trả về label của danh hiệu (subAward custom)
  const getSubAwardLabel = (record) => {
    if (!record?.subAward) return "";
    if (record.subAward.type === "custom") {
      return record.subAward.label;
    }
    return "";
  };

  // Hàm lấy tên (hoặc code) năm học
  const findSchoolYearLabel = (syId) => {
    const syDoc = schoolYears.find((sy) => String(sy._id) === String(syId));
    return syDoc?.code || syDoc?.name || "";
  };

  // Auto-select first school year if none selected and data is available
  useEffect(() => {
    if (displaySchoolYears.length > 0 && !selectedSchoolYearId) {
      setSelectedSchoolYearId(String(displaySchoolYears[0]._id));
    }
  }, [displaySchoolYears, selectedSchoolYearId]);

  // Lấy text từ DB (hoặc i18n)
  const rawText =
    i18n.language === "vi"
      ? currentCategory.name || t("award", "Danh hiệu")
      : currentCategory.nameEng || t("award", "Award");

  // Nếu DB lưu nhầm thành \\n, bạn có thể replace:
  const normalizedText = rawText.replace(/\\n/g, "\n");

  // Tách thành mảng theo ký tự xuống dòng
  const lines = normalizedText.split("\n");

  return (
    <div className="lg:p-6 px-3 mb-10 lg:min-w-[960px] w-full mx-auto mt-[40px] overflow-y-auto">
      {/* Tiêu đề, mô tả và ảnh cover */}
      <div>
        <div className="flex flex-col shimmer-text-title text-center items-center justify-center uppercase leading-tight">
          {lines.map((line, idx) => {
            const textSize =
              i18n.language === "vi"
                ? idx === 0
                  ? "text-[50px] font-[Metropolis]"
                  : "text-[70px] font-black font-[Metropolis]"
                : idx === 0
                  ? "text-[70px] font-black font-[Metropolis]"
                  : "text-[50px] font-[Metropolis]";

            return (
              <div key={idx} className={textSize}>
                {line}
              </div>
            );
          })}
          <img src={`/halloffame/vector.png`} alt="Cover" />
        </div>
        <div className="lg:w-[900px] w-full mx-auto text-left mt-4 mb-4">
          <div className="mb-4 text-[#002855] text-justify font-semibold lg:text-[18px] text-[15px]">
            {i18n.language === "vi"
              ? currentCategory.description || ""
              : currentCategory.descriptionEng || ""}
          </div>
        </div>
        {currentCategory.coverImage && (
          <div className="relative mb-4 mt-8 w-full max-h-[470px] mx-auto">
            {/* Lớp dưới cùng: ảnh coverImage */}
            <img
              src={`${BASE_URL}${currentCategory.coverImage}`}
              alt="Cover"
              className="w-full max-h-[470px] object-cover"
            />
            {/* Lớp giữa: khung frame-cover.png đè lên */}
            <img
              src={`/halloffame/frame-cover.png`}
              alt="Frame Cover"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            {/* Lớp trên cùng: text ở góc trên bên phải căn giữa theo chiều dọc */}
            <div className="absolute top-0 right-0 h-full flex items-center justify-center pr-4">
              <div className="text-[#f9d16f] text-right lg:mr-8 lg:mt-12 leading-tight ">
                {lines.map((line, idx) => {
                  const textSize =
                    i18n.language === "vi"
                      ? idx === 0
                        ? "lg:text-[52px] text-[18px]"
                        : "lg:text-[70px] text-[20px] font-extrabold"
                      : idx === 0
                        ? "lg:text-[70px] text-[20px] font-extrabold"
                        : "lg:text-[52px] text-[18px] ";

                  return (
                    <div key={idx} className={textSize}>
                      {line}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Phần chọn năm học và tìm kiếm tên học sinh */}
      <div className="flex flex-col md:flex-row gap-4 items-center space-x-4 my-10 justify-center">
        <select
          value={selectedSchoolYearId}
          onChange={(e) => setSelectedSchoolYearId(e.target.value)}
          className="md:w-[250px]  py-2 border-none bg-[#F8F8F8] text-[#757575] rounded-2xl"
        >
          <option value="">{t("selectSchoolYear", "Chọn năm học")}</option>
          {displaySchoolYears.map((sy) => (
            <option key={sy._id} value={sy._id}>
              {t("schoolYear")} {findSchoolYearLabel(sy._id)}
            </option>
          ))}
        </select>
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={t("searchNamePlaceholder", "Tìm kiếm")}
            className="md:w-[400px] w-[250px] px-4 py-2 bg-[#f5f5f5] text-[#757575] border-none rounded-full focus:outline-none"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
          />
          <button className="absolute right-3 w-[36px] h-[36px] rounded-full flex items-center justify-center hover:bg-[#e5e5e5] transition">
            <FaSearch className="text-[#757575] text-[18px]" />
          </button>
        </div>
      </div>

      {/* Hiển thị các record, nhóm theo SubAward (mỗi SubAward là 1 Level) */}
      {sortedGroups.map(({ subAwardLabel, recordsGroup, priority }) => {
        // Lấy subAward từ category để có thông tin labelEng
        const subAward = currentCategory.subAwards?.find(
          (sub) => sub.label === subAwardLabel
        );

        // Lấy danh sách các student từ mỗi record trong group
        const studentItems = recordsGroup.flatMap((record) =>
          record.students.map((student) => ({ record, student }))
        );

        return (
          <div
            key={subAwardLabel}
            className="w-full border-b border-gray-200 pb-4 mx-auto"
          >
            <div
              className="w-full flex justify-between items-center cursor-pointer py-4 font-semibold"
              onClick={() =>
                setOpenLevel(openLevel === subAwardLabel ? null : subAwardLabel)
              }
            >
              <span
                className="font-bold lg:text-2xl text-xl"
                style={{ color: priorityColors[priority - 1] || "#002855" }}
              >
                {i18n.language === "vi"
                  ? subAwardLabel
                  : subAward?.labelEng || subAwardLabel}
              </span>
              <span className="text-gray-500 text-lg">
                {openLevel === subAwardLabel ? (
                  <FaAngleDown />
                ) : (
                  <FaAngleRight />
                )}
              </span>
            </div>
            {(openLevel === subAwardLabel ||
              expandedGroups.has(subAwardLabel)) && (
              <div className="w-full grid justify-items-center 2xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-3 grid-cols-2 gap-x-[8px] gap-y-[20px] lg:gap-x-[30px] lg:gap-y-[35px]">
                {studentItems.map((item, idx) => {
                  const { record, student } = item;
                  return (
                    <div
                      key={`${subAwardLabel}-${idx}`}
                      className="lg:h-[400px] lg:w-[258px] w-[180px] h-[270px] border rounded-[20px] shadow-sm lg:py-[20px] lg:px-[25px] px-[15px] py-[15px] bg-gradient-to-b from-[#03171c] to-[#182b55] flex flex-col items-center justify-center space-y-2 cursor-pointer"
                      onClick={() => handleOpenModal(record, student)}
                    >
                      {student.photo?.photoUrl ? (
                        <img
                          src={`${BASE_URL}${student.photo.photoUrl}`}
                          alt="Student"
                          className="lg:h-[260px] lg:w-[208px] w-[208px] h-[160px] object-cover object-top rounded-[15px]"
                        />
                      ) : (
                        <div className="text-xs italic text-gray-400">
                          {t("noPhoto", "Chưa có ảnh")}
                        </div>
                      )}
                      <div className="h-[20px] w-[208px] lg:text-[16px] text-xs lg:pt-[13px] lg:pb-[15px] pt-[8px] pb-[10px] font-semibold text-white py-2 text-center">
                        {t("classLabel", "Lớp")}{" "}
                        {student.currentClass?.name ||
                          student.currentClass?.className ||
                          t("noClass", "Chưa cập nhật lớp")}
                      </div>
                      <div className="h-[60px] lg:w-[208px] w-[150px] text-[#f9d16f]  lg:text-[18px] text-[14px] font-bold text-center">
                        {student.student?.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      {/* Modal hiển thị chi tiết khi click vào 1 học sinh */}
      {showModal && modalStudent && modalRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={handleCloseModal}
        >
          {/* Desktop Version */}
          <div
            className="hidden xl:flex relative md:w-[60%] w-[70%] max-w-[1200px] px-10 py-10 rounded-xl max-h-[90vh] items-stretch overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/halloffame/scholarship.svg"
              alt="Modal Background"
              className="hidden lg:block absolute inset-0 w-full h-full object-cover"
            />
            <img
              src="/halloffame/scholarship-mobile.svg"
              alt="Modal Background (mobile)"
              className="block lg:hidden absolute inset-0 w-full h-full object-cover"
            />

            {/* Left curved panel */}
            <div className="relative w-[50%] max-h-[80%] p-10 flex flex-row lg:flex-col">
              <div className="w-full h-full border border-[#F9D16F] rounded-xl p-9 flex-grow overflow-y-hidden hover:overflow-y-auto">
                <p className="xl:text-base text-sm font-semibold text-justify text-white mb-[13%]">
                  {i18n.language === "vi"
                    ? modalStudent.note
                    : modalStudent.noteEng}
                </p>
              </div>
              <img
                src={`${BASE_URL}${modalStudent.photo?.photoUrl}`}
                alt={modalStudent.student?.name}
                className="absolute object-cover object-top -bottom-[3%] left-1/2 transform -translate-x-1/2 w-28 h-28 rounded-full shadow-lg"
              />
            </div>
            {/* Right content */}
            <div className="w-[60%] h-full py-10 px-5 flex flex-col relative z-10">
              {" "}
              <button
                onClick={handleCloseModal}
                className="absolute -top-[5%] right-0 text-[#F9D16F] hover:text-gray-800"
              >
                <FaTimes size={20} />
              </button>
              <div className="w-full items-center flex justify-center">
                <img
                  src={`/halloffame/Vector-${
                    (modalRecord.subAward?.type === "custom" &&
                      currentCategory.subAwards?.find(
                        (s) =>
                          s.type === "custom" &&
                          s.label === modalRecord.subAward.label
                      )?.priority) ||
                    modalRecord.subAward?.priority ||
                    1
                  }-${i18n.language === "vi" ? "vi" : "en"}.svg`}
                  alt={`HB ${getSubAwardLabel(modalRecord)}`}
                  className="mb-2 w-[90%]"
                />
              </div>
              <div className="w-full xl:text-xl text-lg font-bold text-[#F9D16F] mt-6">
                {modalStudent.student?.name?.toUpperCase()}
              </div>
              <div className="w-full xl:text-base text-sm font-semibold text-[#F9D16F] my-3">
                {t("classLabel", "Lớp")}{" "}
                {modalStudent.currentClass?.name ||
                  modalStudent.currentClass?.className ||
                  t("noClass", "Chưa cập nhật lớp")}
              </div>
              {/* Traits row */}
              <hr className="border-gray-300 mb-6" />
              {/* Activities list */}
              <ul className="max-h-[250px] py-auto flex flex-col items-start justify-center space-y-3">
                {(i18n.language === "vi"
                  ? modalRecord.students.find(
                      (s) => s.student?._id === modalStudent.student?._id
                    )?.activity
                  : modalRecord.students.find(
                      (s) => s.student?._id === modalStudent.student?._id
                    )?.activityEng
                )?.map((act, idx) => (
                  <li key={idx} className="flex items-center font-bold">
                    <img
                      src="/halloffame/star.svg"
                      alt="star"
                      className="mt-1 flex-shrink-0 w-5 h-5"
                    />
                    <p className="ml-3 text-white text-sm">{act}</p>
                  </li>
                ))}
              </ul>
              <hr className="border-gray-300 mt-6" />
            </div>
          </div>

          {/* Mobile Version */}
          <div
            className="flex xl:hidden flex-col relative w-[90%] max-h-[90%] px-4 py-8 rounded-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/halloffame/scholarship-mobile.svg"
              alt="Modal Background (mobile)"
              className="absolute inset-0 w-full h-full object-cover"
            />

            <div className="relative w-full flex flex-col items-center z-10">
              <button
                onClick={handleCloseModal}
                className="absolute top-0 right-2 text-[#F9D16F] hover:text-gray-800"
              >
                <FaTimes size={16} />
              </button>

              {/* Vector image */}
              <div className="w-full items-center flex justify-center my-6">
                <img
                  src={`/halloffame/Vector-${
                    modalRecord.subAward?.priority || 1
                  }-${i18n.language === "vi" ? "vi" : "en"}.svg`}
                  alt={`HB ${getSubAwardLabel(modalRecord)}`}
                  className="w-[90%] max-h-[80px]"
                />
              </div>

              {/* Note section with student photo on top */}
              <div className="w-full h-full px-4 pt-12 mb-4 flex justify-center">
                <div className="relative w-full">
                  <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                    <img
                      src={`${BASE_URL}${modalStudent.photo?.photoUrl}`}
                      alt={modalStudent.student?.name}
                      className="w-[100px] h-[100px] rounded-full object-cover object-top shadow-lg"
                    />
                  </div>
                  <div className="h-full border border-[#F9D16F] rounded-xl pt-16 p-4">
                    <p className="text-sm font-semibold text-justify  text-white max-h-[200px] overflow-y-hidden hover:overflow-y-auto">
                      {i18n.language === "vi"
                        ? modalStudent.note
                        : modalStudent.noteEng}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student info */}
              <div className="w-full px-4 text-start mb-4">
                <div className="text-lg font-bold text-[#F9D16F] mb-2">
                  {modalStudent.student?.name?.toUpperCase()}
                </div>
                <div className="text-sm font-semibold text-[#F9D16F]">
                  {t("classLabel", "Lớp")}{" "}
                  {modalStudent.currentClass?.name ||
                    modalStudent.currentClass?.className ||
                    t("noClass", "Chưa cập nhật lớp")}
                </div>
              </div>

              <hr className="w-full border-gray-300 mb-4" />

              {/* Activities */}
              <div className="w-full px-4 max-h-[200px] overflow-y-hidden hover:overflow-y-auto">
                <ul className="flex flex-col items-start space-y-3">
                  {(i18n.language === "vi"
                    ? modalRecord.students.find(
                        (s) => s.student?._id === modalStudent.student?._id
                      )?.activity
                    : modalRecord.students.find(
                        (s) => s.student?._id === modalStudent.student?._id
                      )?.activityEng
                  )?.map((act, idx) => (
                    <li key={idx} className="flex items-center font-bold">
                      <img
                        src="/halloffame/star.svg"
                        alt="star"
                        className="mt-1 flex-shrink-0 w-5 h-5"
                      />
                      <p className="ml-3 text-white text-sm">{act}</p>
                    </li>
                  ))}
                </ul>
              </div>
              <hr className="w-full border-gray-300 my-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarShipContent;
