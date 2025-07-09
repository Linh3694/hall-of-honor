import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import i18n from "../../core/i18n";
import Splide from "@splidejs/splide";
import { AutoScroll } from "@splidejs/splide-extension-auto-scroll";
import "@splidejs/splide/dist/css/splide.min.css";
import "animate.css";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import useResponsive from "../../shared/hook/useResponsive";

gsap.registerPlugin(ScrollTrigger);

const HallofFame = () => {
  // --- i18n, Header logic ---
  const { t } = useTranslation();
  const toggleLanguage = () => {
    const newLanguage = i18n.language === "vi" ? "en" : "vi";
    i18n.changeLanguage(newLanguage);
  };
  // 1. Thêm state mới ngay sau các state đã có (ví dụ, sau const [quoteIndex, setQuoteIndex] = useState(null);)
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { width, isMobile } = useResponsive();
  const isMobileView = isMobile; // hoặc: width < 1024;

  useEffect(() => {
    document.title = "Wellspring Hà Nội | Hall of Honor";
    // Cleanup function để reset title khi unmount
    return () => {
      document.title = "Wellspring";
    };
  }, []);

  const ReadMoreText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const toggleExpanded = () => setIsExpanded((prev) => !prev);

    // Lấy thông tin responsive
    const { isMobile: isMobileResponsive } = useResponsive();

    // Ở màn hình lớn, không giới hạn (Infinity). Ở màn hình nhỏ, 470 ký tự.
    const threshold = isMobileResponsive ? 470 : Infinity;
    // Kiểm tra xem có cần cắt không
    const shouldTruncate = text.length > threshold;

    // Nếu không cần cắt hoặc đã mở rộng => hiển thị đầy đủ
    // Nếu cần cắt => hiển thị đến threshold + "..."
    const displayText =
      isExpanded || !shouldTruncate
        ? text
        : text.substring(0, threshold) + "...";

    return (
      <div>
        <p
          style={{ whiteSpace: "pre-line" }}
          className="text-[#002855] xl:text-lg lg:text-base md:text-sm text-[14px] text-semibold leading-relaxed"
        >
          {displayText}
        </p>
        {shouldTruncate && (
          <button
            onClick={toggleExpanded}
            className="text-[#002147] font-bold text-xs mt-2 md:hidden"
          >
            {isExpanded ? t("readLess") : t("readMore")}
          </button>
        )}
      </div>
    );
  };

  const principals = [
    {
      name: t("principal1.name"),
      title: t("principal1.title"),
      message: t("principal1.message"),
      quote: {
        text: t("principal1.quote.text"),
        author: t("principal1.quote.author"),
      },
      image: `/halloffame/nguyenvinhson.png`,
    },
    {
      name: t("principal2.name"),
      title: t("principal2.title"),
      message: t("principal2.message"),
      image: `/halloffame/hoangthiminh.png`,
    },
    {
      name: t("principal3.name"),
      title: t("principal3.title"),
      message: t("principal3.message"),
      image: `/halloffame/lethuynga.png`,
    },
  ];

  const navigate = useNavigate();
  const section1Ref = useRef(null);
  const section2Ref = useRef(null);

  const swiperRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // State responsive cho kích thước slide
  const [itemWidth, setItemWidth] = useState(1280);
  const [itemHeight, setItemHeight] = useState(560);

  const [topImages, setTopImages] = useState([]);
  const [bottomImages, setBottomImages] = useState([]);
  const starStudents = t("starStudents", { returnObjects: true });

  const preloadImages = (imageUrls) => {
    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  };

  const marqueeRef = useRef(null);

  useEffect(() => {
    // Chỉ preload ảnh đầu tiên để cải thiện tốc độ load
    const initialImages = Array.from(
      { length: 5 }, // Chỉ load trước 5 ảnh đầu tiên
      (_, i) => `/halloffame/students/student${i + 1}.webp`
    );

    setTopImages(initialImages);
    setBottomImages(initialImages);
    preloadImages(initialImages);

    // Sau 2 giây, tải toàn bộ danh sách ảnh (tối ưu hiệu suất)
    setTimeout(() => {
      const fullImages = Array.from(
        { length: 20 },
        (_, i) => `/halloffame/students/student${i + 1}.webp`
      );
      setTopImages(fullImages.slice(0, 10));
      setBottomImages(fullImages.slice(10, 20));
    }, 2000);
  }, []);

  useEffect(() => {
    // Lấy tất cả các phần tử marquee container có class 'pre-init'
    const marqueeElements = document.querySelectorAll(
      ".marquee-container.pre-init"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 } // Điều chỉnh ngưỡng nếu cần
    );

    marqueeElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      marqueeElements.forEach((element) => {
        observer.unobserve(element);
      });
    };
  }, []);

  useEffect(() => {
    const splide = new Splide(".splide", {
      type: "loop",
      drag: "free",
      focus: "center",
      autoWidth: true,
      autoScroll: {
        speed: 0.5,
      },
      gap: "40px", // Hoặc 20, 30px, v.v.
      pagination: false, // Tắt dấu chấm phân trang
    });

    splide.mount({ AutoScroll });

    return () => splide.destroy();
  }, []);

  useEffect(() => {
    if (isMobileView) {
      const splideTop = new Splide("#splide-mobile-top", {
        type: "loop",
        drag: "free",
        autoWidth: true,
        focus: "center",
        autoScroll: {
          speed: 0.5,
        },
        gap: "20px",
        direction: "ltr",
        arrows: false, // Tắt mũi tên 2 bên
        pagination: false, // Tắt dấu chấm phân trang
      });
      splideTop.mount({ AutoScroll });

      const splideBottom = new Splide("#splide-mobile-bottom", {
        type: "loop",
        drag: "free",
        autoWidth: true,
        focus: "center",
        autoScroll: {
          speed: 0.5,
        },
        gap: "20px",
        // Cho hàng dưới chạy ngược chiều
        direction: "rtl",
        arrows: false, // Tắt mũi tên 2 bên
        pagination: false, // Tắt dấu chấm phân trang
      });
      splideBottom.mount({ AutoScroll });

      return () => {
        splideTop.destroy();
        splideBottom.destroy();
      };
    }
  }, [isMobileView]);

  // Tính toán kích thước slide dựa trên window.innerWidth
  useEffect(() => {
    if (width < 640) {
      setItemWidth(width * 0.9);
      setItemHeight(450);
    } else if (width < 1024) {
      setItemWidth(width * 0.85);
      setItemHeight(400);
    } else if (width < 1600) {
      setItemWidth(width * 0.75);
      setItemHeight(500);
    } else {
      setItemWidth(1280);
      setItemHeight(560);
    }
  }, [width]);

  useEffect(() => {
    gsap.fromTo(
      ".section2-title",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  useEffect(() => {
    gsap.fromTo(
      ".section2-slide",
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: section2Ref.current,
          start: "top 60%",
          toggleActions: "play none none none",
        },
      }
    );
  }, []);

  // currentSlide: index của ảnh đang được highlight (phóng to)
  const [currentSlide, setCurrentSlide] = useState(0);
  // quoteIndex: index của ảnh đang mở quote (nếu = null thì đóng)
  const [quoteIndex, setQuoteIndex] = useState(null);

  // Dùng ref để lưu trữ interval, dễ dàng clear khi mở quote
  const autoSlideRef = useRef(null);

  // Hàm khởi tạo auto-slide (chuyển slide 3s/lần)
  const startAutoSlide = () => {
    // Đảm bảo clear trước khi setInterval mới
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    autoSlideRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % starStudents.length);
    }, 3000);
  };

  // Hàm dừng auto-slide
  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
  };

  // Khởi tạo auto-slide khi mount
  useEffect(() => {
    startAutoSlide();
    return () => {
      // Clear interval khi unmount
      stopAutoSlide();
    };
  }, []);

  // Xử lý click ảnh -> toggle quote
  const handleClickStudent = (index) => {
    if (quoteIndex === index) {
      // Đang mở -> đóng
      setQuoteIndex(null);
      // Khởi động lại auto-slide
      startAutoSlide();
    } else {
      // Đóng quote khác (nếu có)
      setQuoteIndex(index);
      // Dừng auto-slide
      stopAutoSlide();
    }
  };

  // ======================
  // Section 3: Carousel cho StarStudents (vòng lặp vô hạn)
  // ======================
  const [starCurrentSlide, setStarCurrentSlide] = useState(2);
  const [starQuoteIndex, setStarQuoteIndex] = useState(null);
  const starContainerRef = useRef(null);
  const starAutoSlideRef = useRef(null);
  const starTransitionRef = useRef(null);

  // Hàm auto-run cho Section 3 (mỗi 2 giây)
  const startStarAutoSlide = () => {
    if (starAutoSlideRef.current) clearInterval(starAutoSlideRef.current);
    starAutoSlideRef.current = setInterval(() => {
      setStarCurrentSlide((prev) => prev + 1);
    }, 2000);
  };

  const stopStarAutoSlide = () => {
    if (starAutoSlideRef.current) {
      clearInterval(starAutoSlideRef.current);
      starAutoSlideRef.current = null;
    }
  };

  useEffect(() => {
    startStarAutoSlide();
    return () => {
      stopStarAutoSlide();
    };
  }, [starStudents]);

  // Thêm state để theo dõi scroll
  const [scrollPosition, setScrollPosition] = useState(0);

  // Thêm useEffect để lắng nghe scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Tính toán scale và opacity dựa vào scroll position
  // const videoScale = Math.max(0.5, 1 - scrollPosition / 1500); // Scale chậm hơn
  const textOpacity = Math.min(1, (scrollPosition - 250) / 100); // Text hiện muộn hơn (từ 400px)
  const textTransform = `translateY(${Math.max(
    0,
    50 - scrollPosition / 15
  )}px)`; // Text di chuyển chậm hơn
  // const borderRadius = Math.min(30, scrollPosition / 30); // Bo góc chậm hơn
  // const videoTranslateY = Math.min(200, scrollPosition / 5); // Di chuyển video lên trên khi scroll

  // Thêm state cho counting animation
  const [counts, setCounts] = useState({
    categories: 0,
    students: 0,
    classes: 0,
  });

  // Thêm state để kiểm soát khi nào bắt đầu counting
  const [shouldStartCounting, setShouldStartCounting] = useState(false);

  // Theo dõi thay đổi của textOpacity để trigger counting
  useEffect(() => {
    if (textOpacity >= 0.9 && !shouldStartCounting) {
      setShouldStartCounting(true);
    }
  }, [textOpacity]);

  // Điều chỉnh animation counting để chỉ bắt đầu khi shouldStartCounting = true
  useEffect(() => {
    if (!shouldStartCounting) return;

    const targetCounts = {
      categories: 11,
      students: 600,
      classes: 12,
    };

    const duration = 1000; // 2 giây
    const steps = 60;
    const interval = duration / steps;

    const counters = {};

    Object.keys(targetCounts).forEach((key) => {
      const target = targetCounts[key];
      const increment = target / steps;
      let current = 0;

      counters[key] = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(counters[key]);
        }
        setCounts((prev) => ({
          ...prev,
          [key]: Math.floor(current),
        }));
      }, interval);
    });

    return () => {
      Object.values(counters).forEach((counter) => clearInterval(counter));
    };
  }, [shouldStartCounting]);

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-[80px] bg-[#002855] text-white flex items-center lg:shadow-none justify-between lg:px-20 px-6 shadow-md z-50">
        {/* Logo bên trái */}
        <div className="flex flex-row gap-10 items-center">
          <button onClick={() => navigate("/")}>
            <img
              src={`/halloffame/HOH-gold.png`}
              className="h-10"
              alt="Wellspring Logo"
            />
          </button>
          <a href="https://wellspring.edu.vn">
            <img
              src={`/halloffame/WS-white.png`}
              className="h-16"
              alt="Wellspring Logo"
            />
          </a>
          <button
            onClick={() => navigate("/detail/scholarship-talent")}
            className="hidden md:block px-4 py-2 rounded-md font-semibold hover:bg-white hover:text-[#002855] transition-colors"
          >
            {t("hallhonor")}
          </button>
        </div>

        {/* Logo/nút khác bên phải */}
        <div className="flex flex-row gap-10 items-center">
          <img
            src={`/halloffame/HJ-white.png`}
            className="h-12 hidden md:block"
            alt="Happy Journey"
          />
          <button
            onClick={toggleLanguage}
            className="w-10 h-10 rounded-full border-2 transition border-gray-300 hover:border-yellow-400 shadow-md"
          >
            <img
              src={
                i18n.language === "vi"
                  ? "/icons/flag-vi.png"
                  : "/icons/flag-en.png"
              }
              alt={t("language", "Language")}
              className="w-full h-full rounded-full object-cover"
            />
          </button>
        </div>
      </header>

      {/* Section 1: Video Background */}
      <section
        ref={section1Ref}
        className=" top-0 w-full h-screen overflow-hidden flex items-center justify-center"
      >
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <video
            className="hidden lg:flex absolute top-0 left-0 w-full h-full object-cover"
            src={`/halloffame/banner.mp4`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
          <video
            className="lg:hidden absolute top-0 left-0 w-full h-full object-cover"
            src={`/halloffame/banner_mobile.mp4`}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
      </section>

      {/* Section mới: Text và Thông số */}
      <section
        className="relative w-full py-20 px-10 xl:px-20 xll:px-44 "
        style={{
          backgroundImage: `url(/halloffame/section3.png)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          className="container mx-auto"
          style={{
            opacity: textOpacity,
            transform: textTransform,
            transition: "all 0.4s ease-out",
          }}
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
            {/* Text bên trái */}
            <div className="w-full lg:w-1/2">
              <p className="text-lg xll:text-2xl font-semibold text-[#F9D16F] shimmer-text text-justify">
                {t("hallhonor_description")}
              </p>
            </div>

            {/* Thông số bên phải */}
            <div className="w-full lg:w-1/2 flex flex-row xl:justify-end justify-center gap-8 md:gap-16">
              <div className="text-center shimmer-text">
                <div className=" text-5xl lg:text-6xl xll:text-7xl 2xl:text-8xl font-bold mb-2 text-[#F9D16F]">
                  {counts.categories}+
                </div>
                <div className="uppercase text-sm md:text-base font-semibold text-[#F9D16F]">
                  {t("category")}
                </div>
              </div>
              <div className="text-center shimmer-text">
                <div className="text-5xl lg:text-6xl xll:text-7xl 2xl:text-8xl font-bold mb-2 text-[#F9D16F]">
                  {counts.students}+
                </div>
                <div className="uppercase text-sm md:text-base font-semibold text-[#F9D16F]">
                  {t("student")}
                </div>
              </div>
              <div className="text-center shimmer-text">
                <div className="text-5xl lg:text-6xl xll:text-7xl 2xl:text-8xl  font-bold mb-2 text-[#F9D16F]">
                  {counts.classes}+
                </div>
                <div className="uppercase text-sm md:text-base font-semibold text-[#F9D16F]">
                  {t("class")}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        ref={section2Ref}
        className="flex bg-white relative w-full flex-col items-center justify-center min-h-screen"
      >
        {/* Tiêu đề */}
        <div className="relative w-full text-center mb-10 z-10">
          <h2 className="section2-title xl:text-[32px] text-[24px] font-semibold text-[#002147] uppercase tracking-wide">
            {t("principalMessageHeader", "Thông điệp của Hiệu trưởng")}
          </h2>
        </div>

        {/* Vùng carousel */}
        <Swiper
          loop={true}
          speed={2000} // Hiệu ứng chuyển slide chậm hơn (1 giây)
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => setActiveSlide(swiper.realIndex)}
          className="section2-slide relative w-full mx-auto z-10 section2-content"
        >
          {principals.map((principal, index) => {
            const isActive = index === activeSlide;
            return (
              <SwiperSlide key={index} className="flex justify-center relative">
                <div
                  style={{ width: itemWidth, height: itemHeight }}
                  className={`animate-nudge carousel-slide flex-shrink-0 rounded-[20px] lg:px-10 lg:py-12 px-7 py-7 overflow-hidden transition-all duration-500 ease-in-out ${
                    isActive
                      ? "bg-[#f8f8f8] backdrop-blur-none scale-100 opacity-100"
                      : "bg-[#000000] backdrop-blur-3xl scale-75 opacity-10"
                  }`}
                >
                  <div className="flex flex-row h-auto items-start">
                    {/* Ảnh nền chìm phía sau */}
                    <img
                      src={`/halloffame/vector-section2.png`}
                      alt="vector-section2"
                      className="hidden md:block absolute xll:-right-12 xll:w-[1000px] xll:-bottom-24 lg:w-[900px] xl:-right-28 xl:-bottom-24 lg:-right-36 lg:-bottom-20 md:w-[800px] md:-bottom-24 md:-right-32 w-[700px] -bottom-8 -right-16 h-auto object-cover pointer-events-none opacity-30"
                    />
                    <img
                      src={`/halloffame/ngon-duoc.png`}
                      alt="ngon-duoc"
                      className="w-auto h-[700px] absolute -bottom-[300px] md:h-[700px] md:-bottom-[400px] pointer-events-none opacity-20 xll:h-[900px] lg:h-[800px] lg:-bottom-[400px] lg:left-10 xl:left-32"
                    />
                    <img
                      src={principal.image}
                      alt={principal.name}
                      className="hidden md:block w-auto xll:max-h-[100%] md:max-h-[90%] max-h-[60%] absolute bottom-0 md:-bottom-[50px] xl:right-15 xll:right-20 md:right-12 right-5 object-contain pointer-events-none"
                    />
                    {/* Cột text */}
                    <div className="w-full md:w-[60%] xl:w-[70%] max-w-[730px] flex flex-col items-center md:items-start text-left z-10">
                      <div>
                        <div className="lg:my-3">
                          <ReadMoreText text={principal.message} />
                        </div>
                        {principal.quote && (
                          <blockquote className="italic text-[#002855] xl:text-lg lg:text-base md:text-sm text-[14px] text-semibold leading-relaxed">
                            “{principal.quote.text}”
                            <footer className="mt-2 md:mr-[10%] xll:mr-0 text-right text-[#002855] xl:text-lg lg:text-md md:text-sm text-[14px] text-semibold leading-relaxed">
                              - {principal.quote.author}
                            </footer>
                          </blockquote>
                        )}
                        <div className="md:hidden mt-10 flex flex-row items-center gap-3">
                          <img
                            src={principal.image}
                            alt={principal.name}
                            className="lg:hidden w-20 h-20 rounded-full object-cover object-top  border-2 border-[#e5e5e5]"
                          />
                          <div className="flex flex-col">
                            <p className="text-[#002147] font-bold xl:text-lg lg:text-base md:text-sm  text-[14px]">
                              {principal.name}
                            </p>
                            <p className="text-[#757575] font-bold xl:text-lg lg:text-base md:text-sm  text-[14px]">
                              {principal.title}
                            </p>
                          </div>
                        </div>
                        <div className="md:mt-5 mt-5 md:flex hidden">
                          <div className="flex flex-col">
                            <p className="text-[#002147] font-bold xl:text-lg lg:text-base md:text-sm  text-[13px]">
                              {principal.name}
                            </p>
                            <p className="text-[#757575] font-bold xl:text-lg lg:text-base md:text-sm  text-[13px]">
                              {principal.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {isActive && (
                  <>
                    {/* Nút chuyển slide bên trái - nằm ngoài card */}
                    <button
                      className="animate-slideOutLeft block absolute top-1/2 left-0 md:left-[2%] lg:left-[5%] transform -translate-y-1/2 transition-all duration-300 hover:-translate-x-4 md:bg-[#e5e5e5] text-[#cacaca] md:text-[#757575] rounded-full p-2"
                      onClick={() => swiperRef.current.slidePrev()}
                    >
                      <FaChevronLeft className="xll:w-6 h-auto w-5" />
                    </button>
                    {/* Nút chuyển slide bên phải - nằm ngoài card */}
                    <button
                      className="animate-slideOutRight block absolute top-1/2 right-0 md:right-[2%] lg:right-[5%] transform -translate-y-1/2 transition-all duration-300 hover:translate-x-4 md:bg-[#e5e5e5] text-[#cacaca] md:text-[#757575] rounded-full p-2"
                      onClick={() => swiperRef.current.slideNext()}
                    >
                      <FaChevronRight className="xll:w-6 h-auto w-5" />
                    </button>
                  </>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </section>

      {isMobileView ? (
        <section
          className="flex relative w-full h-screen flex-col items-center justify-center bg-cover bg-center overflow-hidden "
          style={{ backgroundImage: `url(/halloffame/section3.png)` }}
        >
          {/* Tiêu đề Section 3 */}
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-4xl font-bold text-[#F9D16F] uppercase">
              {t("student_feedback")}
            </h2>
            <div className="flex justify-center my-5">
              <img
                src={`/halloffame/vector.png`}
                alt="Divider"
                className="w-[500px] md:w-[500px] h-auto"
              />
            </div>
          </div>

          {/* Splide hàng trên */}
          <div id="splide-mobile-top" className="splide w-full mb-6">
            <div className="splide__track">
              <ul className="splide__list">
                {(() => {
                  // Chia mảng starStudents làm 2
                  const half = Math.ceil(starStudents.length / 2);
                  const topStudents = starStudents.slice(0, half);
                  return topStudents.map((student, index) => (
                    <li
                      className="splide__slide relative flex transition-all duration-500 overflow-hidden w-auto cursor-pointer"
                      key={`top-${index}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      {/* Ảnh học sinh */}
                      <div className="relative w-[220px] h-[250px]">
                        <img
                          src={student.image}
                          alt={student.name[i18n.language]}
                          className="absolute inset-0 w-full h-full object-cover object-top rounded-xl"
                        />
                      </div>
                      {/* Frame Avatar */}
                      <div className="absolute inset-0 pointer-events-none z-50">
                        <img
                          src={`/halloffame/frameavatar.png`}
                          alt="Avatar Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Overlay gradient chứa text */}
                      <div
                        className="w-[220px] px-4 py-4 absolute bottom-0 transition-all duration-500 rounded-b-lg"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10, 40, 80, 1) 0%, rgba(30, 60, 120, 0) 100%)",
                        }}
                      >
                        <p className="text-base uppercase font-bold text-[#F9D16F]">
                          {student.name[i18n.language]}
                        </p>
                        <p className="text-xs font-semibold text-[#F9D16F]">
                          {student.year[i18n.language]}
                        </p>
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>

          {/* Splide hàng dưới (đảo mảng + direction=rtl) */}
          <div id="splide-mobile-bottom" className="splide w-full">
            <div className="splide__track">
              <ul className="splide__list">
                {(() => {
                  const half = Math.ceil(starStudents.length / 2);
                  // bottomStudents = phần sau + reverse() nếu bạn muốn
                  const bottomStudents = starStudents.slice(half);
                  return bottomStudents.map((student, index) => (
                    <li
                      className="splide__slide relative flex transition-all duration-500 overflow-hidden w-auto cursor-pointer"
                      key={`bottom-${index}`}
                      onClick={() => setSelectedStudent(student)}
                    >
                      {/* Ảnh học sinh */}
                      <div className="relative w-[220px] h-[250px]">
                        <img
                          src={student.image}
                          alt={student.name[i18n.language]}
                          className="absolute inset-0 w-full h-full object-cover object-top rounded-xl"
                        />
                      </div>
                      {/* Frame Avatar */}
                      <div className="absolute inset-0 pointer-events-none z-50">
                        <img
                          src={`/halloffame/frameavatar.png`}
                          alt="Avatar Frame"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Overlay gradient chứa text */}
                      <div
                        className="w-[220px] px-4 py-4 absolute bottom-0 transition-all duration-500 rounded-b-lg"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10, 40, 80, 1) 0%, rgba(30, 60, 120, 0) 100%)",
                        }}
                      >
                        <p className="text-base uppercase font-bold text-[#F9D16F]">
                          {student.name[i18n.language]}
                        </p>
                        <p className="text-xs font-semibold text-[#F9D16F]">
                          {student.year[i18n.language]}
                        </p>
                      </div>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>
        </section>
      ) : (
        <section
          className="flex relative w-full h-[720px] flex-col items-center justify-center bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(/halloffame/section3.png)` }}
        >
          {/* Tiêu đề Section 3 */}
          <div className="text-center mb-12">
            <h2 className="text-[36px] md:text-4xl font-bold text-[#F9D16F] uppercase">
              {t("student_feedback")}
            </h2>
            <div className="flex justify-center my-5">
              <img
                src={`/halloffame/vector.png`}
                alt="Divider"
                className="w-[200px] md:w-[500px] h-auto"
              />
            </div>
          </div>
          {/* Slider Splide */}
          <div className="splide w-full">
            <div className="splide__track">
              <ul className="splide__list">
                {starStudents.map((student, index) => {
                  const isActive = index === quoteIndex;
                  return (
                    <li
                      className={`
                  splide__slide 
                  relative 
                  flex 
                  transition-all 
                  duration-500
                  overflow-hidden
                  ${
                    isActive
                      ? "lg:w-[840px] w-[840px]"
                      : "lg:w-[420px] w-[420px]"
                  }
                `}
                      onClick={() => handleClickStudent(index)}
                      key={index}
                    >
                      <div className="relative lg:h-[420px] lg:w-[420px] w-[200px] h-[250px] cursor-pointer">
                        <img
                          src={student.image}
                          alt={student.name[i18n.language]}
                          className="absolute inset-0 w-full h-full object-cover object-top rounded-xl transition-all duration-500"
                        />
                      </div>
                      {!isActive && (
                        <div className="absolute inset-0 lg:w-[420px] lg:h-[420px] w-[200px] h-[250px] pointer-events-none z-50">
                          <img
                            src={`/halloffame/frameavatar.png`}
                            alt="Avatar Frame"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {isActive && (
                        <div className="absolute inset-0 lg:w-[840px] w-[500px] h-full pointer-events-none z-50 flex items-stretch">
                          <img
                            src={`/halloffame/framequote.png`}
                            alt="Quote Frame"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className="lg:w-[420px] w-[200px] px-4 lg:py-28 py-20 absolute bottom-0 transition-all duration-500 rounded-b-lg cursor-pointer"
                        style={{
                          background:
                            "linear-gradient(to top, rgba(10, 40, 80, 1) 0%, rgba(30, 60, 120, 0) 100%)",
                        }}
                      >
                        <p className="absolute bottom-10 lg:text-3xl text-base uppercase font-bold text-[#F9D16F]">
                          {student.name[i18n.language]}
                        </p>
                        <p className="absolute bottom-4 lg:text-base text-xs font-semibold text-[#F9D16F]">
                          {student.year[i18n.language]}
                        </p>
                      </div>
                      {isActive && (
                        <div
                          className={`${
                            isActive
                              ? "max-w-[250px] lg:max-w-[420px] opacity-100"
                              : "max-w-0 opacity-0"
                          } transition-all duration-300 rounde-xl p-6`}
                        >
                          <div style={{ whiteSpace: "pre-line" }}>
                            <p className="lg:text-xl text-base uppercase font-bold text-[#F9D16F] mb-2">
                              {student.name[i18n.language]}
                            </p>
                            <p className="text-sm font-semibold text-[#F9D16F]">
                              {student.archivement[i18n.language]}
                            </p>
                          </div>
                          <div className="my-5">
                            <img src={`/halloffame/vector.png`} alt="Cover" />
                          </div>
                          <p className="text-white md:text-[14px]">
                            "
                            {i18n.language === "vi"
                              ? student.quoteVi
                              : student.quoteEn}
                            "
                          </p>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>
      )}
      {isMobileView && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div
            className="md:w-[80%] w-[95%] rounded-[20px] py-5 relative shadow-lg"
            style={{
              backgroundImage: `url(${
                window.innerWidth >= 1024
                  ? `/halloffame/studentcard-desktop.png`
                  : `/halloffame/studentcard-mobile.png`
              })`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            {/* Bố cục chia làm 2 phần: Ảnh bên trái - Thông tin bên phải */}
            <div className="flex flex-col space-y-6 ">
              {/* Khung ảnh với nền lệch */}
              <div className="w-full relative flex-shrink-0 px-[25px] lg:px-0">
                {selectedStudent.image ? (
                  <img
                    src={`${CDN_URL}/Students/${selectedStudent.image}`}
                    alt="Student"
                    className="relative z-10 w-full h-[300px] md:h-[500px] items-center object-cover object-top  rounded-[15px] shadow-md"
                  />
                ) : (
                  <div className="relative z-10  w-[150px] h-[200px] bg-gray-200 flex items-center justify-center rounded-lg shadow-md">
                    <span className="text-xs text-gray-400">
                      {t("noPhoto", "Chưa có ảnh")}
                    </span>
                  </div>
                )}
              </div>

              {/* Phần thông tin học sinh */}
              <div className="flex flex-col items-start justify-start px-[20px]">
                <div className="lg:w-[500px] w-full flex flex-col">
                  <h2 className="lg:text-[24px] text-[16px] font-bold text-[#F9D16F]">
                    {selectedStudent.name?.[i18n.language] ||
                      selectedStudent.name ||
                      "Unknown"}
                  </h2>
                  <div className="flex justify-start gap-6 mt-1 text-[#F9D16F] text-[14px]">
                    {selectedStudent.archivement?.[i18n.language] && (
                      <p className="w-full mb-2 font-semibold text-[#F9D16F] text-[13px] md:text-[15px]">
                        {selectedStudent.archivement[i18n.language]}
                      </p>
                    )}
                  </div>
                  <hr className="border-t border-gray-100 my-3 w-full" />
                </div>

                <div className="border-b-2 pb-4">
                  {/* Nội dung trích dẫn (quoteVi, quoteEn) */}
                  {selectedStudent.quoteVi || selectedStudent.quoteEn ? (
                    <p className="text-white my-auto text-justify text-[13px] md:text-[16px]">
                      {i18n.language === "vi"
                        ? selectedStudent.quoteVi
                        : selectedStudent.quoteEn}
                    </p>
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </div>

            {/* Nút đóng */}
            <div className="flex w-full mx-auto items-center justify-center mt-4">
              <button
                onClick={() => setSelectedStudent(null)}
                className="bg-[#F9D16F] lg:px-16 px-2 lg:py-1 py-1 rounded-md text-[#002855] text-[13px] lg:text-[16px] font-semibold hover:bg-gray-400"
              >
                {t("close", "Đóng")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Section: Dấu ấn danh vọng */}
      <section className="flex bg-white relative w-full flex-col items-center justify-center lg:p-40 p-10 overflow-hidden">
        {/* Ảnh nền chìm */}
        <div
          className="lg:w-[1075px] w-[500px] lg:h-[1075px] h-[500px] absolute -right-44 -bottom-[200px] bg-no-repeat bg-contain"
          style={{
            backgroundImage: `url(/halloffame/WS-opacity-20.png)`,
          }}
        />

        {/* Tiêu đề */}
        <h2 className="lg:text-[32px] text-[20px] font-bold text-[#002147] uppercase ">
          {t("hallmark_of_fame")}
        </h2>
        <h2 className="lg:text-[28px] text-[16px] text-[#002147] uppercase mb-12">
          {t("hallmark_of_fame_02")}
        </h2>

        {/* Video Section */}
        <div className="relative flex flex-row w-full items-center justify-center mb-10">
          <div className="relative w-full max-w-[1280px] aspect-video">
            <iframe
              className="w-full h-full rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/EGg3VHb8gGE?rel=0&modestbranding=1&playsinline=1"
              title="Wellspring Hall of Honor"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      {/* Section slider */}
      <section className="flex bg-white relative w-full h-[570px] overflow-hidden">
        {/* Slider 2 hàng, full width */}
        <div className="absolute top-0 left-0 w-full h-full my-20">
          {/* Hàng ảnh trên */}
          <div className="marquee-container pre-init" ref={marqueeRef}>
            <div className="marquee-track">
              {topImages.map((img, index) => (
                <img
                  key={`top-${index}`}
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {/* Lặp lại để cuộn liên tục */}
              {topImages.map((img, index) => (
                <img
                  key={`top2-${index}`}
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
            </div>
          </div>

          {/* Hàng ảnh dưới - thêm offset để so le */}
          <div className="marquee-container pre-init" ref={marqueeRef}>
            <div className="marquee-track">
              {bottomImages.map((img, index) => (
                <img
                  key={`bottom-${index}`}
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
              {bottomImages.map((img, index) => (
                <img
                  key={`bottom2-${index}`}
                  src={img}
                  alt="student"
                  className="h-52 w-56 object-cover rounded-2xl mx-4"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Overlay gradient nửa trong suốt */}
        <div
          className="absolute inset-0 pointer-events-none 
               bg-[linear-gradient(180deg,rgba(24,43,85,0.6)_0%,rgba(24,43,85,1)_95%)]
               shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
        />
        {/* Nội dung đè lên slider + overlay */}
        {/*   Mobile */}
        <div className="lg:hidden relative z-10 w-full h-full flex flex-row items-center justify-between 2xl:px-[200px] md:px-[120px] text-center text-white">
          <div className="w-full flex flex-col items-center justify-center">
            <h3 className="shimmer-text text-[32px] font-bold mb-4">
              Khám phá
            </h3>
            <img
              src={`/halloffame/HOH-gold.png`}
              alt="Hall of Honor"
              className="shimmer-text 2xl:w-[550px] xl:w-[400px] w-[300px] mb-8"
            />
            <button
              onClick={() => navigate("/hall-of-honor/detail")}
              className="xl:w-[433px] w-[300px] mt-10 xl:px-16 px-10 py-2 bg-[#F9D16F] rounded-full font-semibold transition-colors"
            >
              <h3 className="shimmer-text-2 xl:text-[24px] text-[20px] font-bold">
                {t("view_hall_of_honor")}
              </h3>
            </button>
          </div>
        </div>
        {/* Desktop */}
        <div className="hidden lg:flex relative z-10 w-full h-full  flex-row items-center justify-between 2xl:px-[200px] md:px-[120px] text-center text-white">
          <div className="flex flex-col text-left">
            <h3 className="shimmer-text text-[32px] font-bold mb-4">
              Khám phá
            </h3>
            <img
              src={`/halloffame/HOH-gold.png`}
              alt="Hall of Honor"
              className="shimmer-text 2xl:w-[550px] xl:w-[400px] w-[300px] mb-8"
            />
          </div>
          <button
            onClick={() => navigate("/hall-of-honor/detail")}
            className="xl:w-[433px] w-[300px] mt-2 xl:px-16 px-10 py-2 bg-[#F9D16F] rounded-full font-semibold transition-colors"
          >
            <h3 className="shimmer-text-2 xl:text-[24px] text-[20px] font-bold">
              {t("view_hall_of_honor")}
            </h3>
          </button>
        </div>
      </section>
      {/* Footer */}
      <div className="hidden lg:block w-full">
        <img
          src={`/halloffame/footer.svg`}
          alt="Footer"
          className="w-full object-cover"
        />
      </div>
      <div className="lg:hidden w-full h-full">
        <img
          src={`/halloffame/Footer_mobile.png`}
          alt="Footer"
          className="w-full object-cover"
        />
      </div>
    </>
  );
};

export default HallofFame;
