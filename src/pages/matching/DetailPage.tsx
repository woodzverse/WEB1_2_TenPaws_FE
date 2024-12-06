import React, { useEffect, useState } from "react";
import { GoX } from "react-icons/go";
import { RxDividerHorizontal } from "react-icons/rx";
import Header from "../../components/Header";
import axiosInstance from "../../utils/axiosInstance"; 
import axios from "axios";

interface PetAdd {
  petName: string;
  species: string;
  size: string;
  age: string;
  gender: string;
  neutering: string;
  reason: string;
  preAdoption: string;
  vaccinated: string;
  extra?: string;
  personality: string;
  exerciseLevel: number;
  shelterId: number;
  shelterName: string;
  address: string;
  imageUrls: File[];
}

interface Shelters {
  shelterName: string;
  address: string;
}

interface UseId {
  Id: number;
}


const DetailPage = () => {
  const [postImg, setPostImg] = useState<File[]>([]); // 업로드된 파일 리스트
  const [previewImg, setPreviewImg] = useState<string[]>([]); // 미리보기 이미지 URL 리스트
  const [useId, setUseId] = useState<UseId>({
    Id: 0
  });

  const [shelterInfo, setShelterInfo] = useState<Shelters>({
    shelterName: "",
    address: ""
  });

  const [addPet, setAddPet] = useState<PetAdd>({
    petName: "",
    species: "",
    size: "",
    age: "",
    gender: "",
    neutering: "",
    reason: "",
    preAdoption: "", 
    vaccinated: "",
    extra: "",
    personality: "",
    exerciseLevel: 0,
    shelterId: useId.Id,
    shelterName: shelterInfo.shelterName,
    address: shelterInfo.address,
    imageUrls: postImg
  });

  const token = "eyJhbGciOiJIUzI1NiJ9.eyJjYXRlZ29yeSI6ImFjY2VzcyIsImVtYWlsIjoic2hlbHRlcnRlc3RAbmF2ZXIuY29tIiwicm9sZSI6IlJPTEVfU0hFTFRFUiIsImlhdCI6MTczMzQwMTIxNywiZXhwIjoxNzMzNDg3NjE3fQ.DqmQSAiGpnGqXOcwIIyF8JK5RrkaT8Mx3SOnHcbmsH4"


  const headers = {
    'Authorization': `Bearer ${token}`,
  };



  // ID 불러오기
  useEffect(() => {
    const shelterId = async () => {
      try {
        const response = await axiosInstance.get(`/api/v1/features/user-id`, {headers});
        setUseId(response.data);
      } catch(error) {
        console.error("보호소 ID를 불러오는 중 오류 발생:", error);
      }
    };
    shelterId();
  }, [])

  //보호소 정보 불러오기
  useEffect(() => {
    if(useId.Id !== 0){
      const shelterInfos = async () => {
        try {
          const response = await axiosInstance.get(`/api/v1/shelters/${useId.Id}`, {headers});
          setShelterInfo(response.data);
        } catch(error) {
          console.error("보호소 정보를 불러오는 중 오류 발생:", error);
        }
      };
      shelterInfos();
    }
  }, [useId.Id])

  useEffect(() => {
    setAddPet((prevState) => ({
      ...prevState,
      shelterId: useId.Id,
      shelterName: shelterInfo.shelterName,
      address: shelterInfo.address,
    }));
  }, [useId.Id, shelterInfo]);


  const saveImgFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileArr = e.target.files;

    if (fileArr) {
      const fileList = Array.from(fileArr); // File 객체 배열로 변환

      // 기존 이미지와 새로운 이미지를 합쳐 저장
      setPostImg((prev) => [...prev, ...fileList]);

      // 새로운 이미지를 읽어와 미리보기 URL 추가
      const fileUrlPromises = fileList.map(
        (file) =>
          new Promise<string>((resolve) => {
            const fileReader = new FileReader();
            fileReader.onload = () => {
              if (fileReader.result) {
                resolve(fileReader.result as string);
              }
            };
            fileReader.readAsDataURL(file);
          })
      );

      // 모든 파일 URL 생성 후 상태 업데이트
      Promise.all(fileUrlPromises).then((urls) => {
        setPreviewImg((prev) => [...prev, ...urls]);
      });
    }
  };

  // select 값 변경 핸들러
  const InputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setAddPet(prevState => ({
      ...prevState,
      [id]: id === 'exerciseLevel' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // 기본 동작 차단
    addPetInfo();
  };

  const addPetInfo = async (): Promise<void> => {
    const petData = new FormData();
  
    // addPet 객체의 키-값 쌍을 순회하면서 FormData에 추가
    // 'imageUrls' 키는 제외 (이미 파일로 처리되기 때문)
    Object.entries(addPet).forEach(([key, value]) => {
      if (key !== 'imageUrls') {
        petData.append(key, value.toString()); // value를 문자열로 변환하여 추가
      }
    });
  
    // postImg 배열에 있는 파일들을 FormData에 추가
    postImg.forEach((file) => {
      petData.append('images', file); // 'images'라는 키로 파일 첨부
    });

    // FormData 내용 디버깅 출력
    console.log("FormData Debugging:");
    petData.forEach((value, key) => {
      console.log(`${key}:`, value);
    });
  
    try {
      // 서버로 POST 요청 보내기
      const response = await axios.post(
        `http://15.164.103.160:8080/api/v1/pets/${useId.Id}`, // API 엔드포인트
        petData, // FormData 객체 전송
        {
          headers: {
            'Authorization': `Bearer ${token}`, // 인증 토큰 추가
            'Content-Type': 'multipart/form-data', // 멀티파트 형식 명시
          },
        }
      );
      alert("동물 등록이 완료되었습니다."); // 성공 시 사용자에게 알림
    } catch (error) {
      // 오류 처리
      if (axios.isAxiosError(error)) {
        console.error("동물 등록 중 오류 발생:", error.response?.data); // 디버깅용 콘솔 출력
        alert(`동물 등록에 실패했습니다. 오류: ${error.response?.data?.message || error.message}`); // 사용자에게 오류 메시지 표시
      } else {
        console.error("알 수 없는 오류 발생:", error); // 알 수 없는 오류 처리
        alert("동물 등록에 실패했습니다. 알 수 없는 오류가 발생했습니다."); // 사용자에게 알림
      }
    }
  };
  
  
  

  return (
    <>
      <Header />
      <form className="flex flex-col items-center mt-10" onSubmit={handleSubmit}>
        <div>
          <h3 className="mb-10 text-2xl font-bold text-mainColor">정보를 입력해주세요</h3>
        </div>
        <section className="flex flex-wrap gap-4">
          {/* 미리보기 이미지 렌더링 */}
          {previewImg.map((imgSrc, i) => (
            <div
              key={i}
              className="relative w-24 h-24 overflow-hidden border rounded"
            >
              <button
                type="button"
                onClick={() => {
                  // 이미지 제거 로직
                  setPreviewImg((prev) => prev.filter((_, index) => index !== i));
                  setPostImg((prev) => prev.filter((_, index) => index !== i));
                }}
                className="absolute p-1 bg-white rounded-full top-1 right-1"
              >
                <GoX />
              </button>
              <img
                src={imgSrc}
                alt={`업로드된 이미지 ${i + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}

          {/* 업로드 가능한 경우 업로드 버튼 표시 */}
          {postImg.length < 5 && (
            <label
              htmlFor="fileUpload"
              className="flex items-center justify-center w-24 h-24 border border-dashed rounded cursor-pointer"
            >
              <span>+</span>
            </label>
          )}

          {/* 파일 업로드 입력 */}
          <input
            id="fileUpload"
            type="file"
            onChange={saveImgFile}
            accept="image/*"
            multiple
            className="hidden"
          />
        </section>
        <section className="mt-10">
          <div className="flex flex-col flex-wrap gap-5">
            <div className="flex items-center justify-between p-2 px-10 border gap-52">
              <label htmlFor="species" className="text-xl">종류</label>
              <select id="species" className="pl-2 text-xs font-bold"  value={addPet.species} onChange={InputChange}>
                <option value="">종류</option>
                <option value="강아지">강아지</option>
                <option value="고양이">고양이</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="petName" className="text-xl">이름</label>
              <input type="text" id="petName" placeholder="예) 코코, 흰둥이" className="w-32 pl-3" value={addPet.petName} onChange={InputChange}/>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="age" className="text-xl">연령</label>
              <select id="age" className="pl-2 text-xs font-bold" value={addPet.age} onChange={InputChange}>
                <option value="">연령</option>
                <option value="0~3살">0~3살</option>
                <option value="4~6살">4~6살</option>
                <option value="7~10살">7~10살</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="gender" className="text-xl">성별</label>
              <select id="gender" className="pl-2 text-xs font-bold" value={addPet.gender} onChange={InputChange}>
                <option value="">성별</option>
                <option value="수컷">수컷</option>
                <option value="암컷">암컷</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="reason" className="text-xl">보호소로 오게 된 이유</label>
              <input type="text" id="reason" placeholder="예) 유기, 보호자 병환" className="pl-2 w-36" value={addPet.reason} onChange={InputChange}/>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="vaccinated" className="text-xl">접종 유무</label>
              <select id="vaccinated" className="pl-2 text-xs font-bold" value={addPet.vaccinated} onChange={InputChange}>
                <option value="">접종유무</option>
                <option value="1">1차</option>
                <option value="2">2차</option>
                <option value="3">3차</option>
                <option value="4">4차</option>
                <option value="5">5차</option>
                <option value="6">6차</option>
                <option value="no">미접종</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="neutering" className="text-xl">중성화 유무</label>
              <select id="neutering" className="pl-2 text-xs font-bold" value={addPet.neutering} onChange={InputChange}>
                <option value="">중성화유무</option>
                <option value="완료">완료</option>
                <option value="미완료">미완료</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="personality" className="text-xl">성격</label>
              <select id="personality" className="pl-2 text-xs font-bold" value={addPet.personality} onChange={InputChange}>
                <option value="">성격</option>
                <option value="얌전함">얌전함</option>
                <option value="활발함">활발함</option>
                <option value="사나움">사나움</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="exerciseLevel" className="text-xl">활동량</label>
              <select id="exerciseLevel" className="pl-2 text-xs font-bold" value={addPet.exerciseLevel} onChange={InputChange}>
                <option value="">적음 1 ~ 많음 5</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="size" className="text-xl">크기</label>
              <select id="size" className="pl-2 text-xs font-bold" value={addPet.size} onChange={InputChange}>
                <option value="">크기</option>
                <option value="소형">소형</option>
                <option value="중형">중형</option>
                <option value="대형">대형</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="preAdoption" className="text-xl">맡겨지기 전 가정환경</label>
              <input type="text" id="preAdoption" placeholder="예) 임시보호, 사육장" className="pl-2 w-36" value={addPet.preAdoption} onChange={InputChange}/>
            </div>
            <div className="flex items-center justify-between p-2 px-10 border">
              <label htmlFor="extra" className="text-xl">추가 정보(선택사항)</label>
              <input type="text" id="extra" placeholder="동물 추가정보 작성" className="pl-2 w-36" value={addPet.extra} onChange={InputChange}/>
            </div>
          </div>
        </section>
        <div className="flex gap-32 my-10">
          <button className="text-mainColor" onClick={addPetInfo}>등록</button>
          <button className="text-cancelColor">취소</button>
        </div>
      </form>
    </>
  );
};

export default DetailPage;