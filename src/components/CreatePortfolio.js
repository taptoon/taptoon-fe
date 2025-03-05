import { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    CircularProgress,
    Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'; // 이미지 첨부 아이콘
import DescriptionIcon from '@mui/icons-material/Description'; // 파일 첨부 아이콘
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import FolderIcon from '@mui/icons-material/Folder'; // 포트폴리오 아이콘

function CreatePortfolio() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]); // 업로드된 이미지 상태 (파일 객체 + 엔티티 ID)
    const [files, setFiles] = useState([]); // 업로드된 파일 상태 (파일 객체 + 엔티티 ID)
    const [portfolioId, setPortfolioId] = useState(null); // 포트폴리오 ID 상태
    const [uploading, setUploading] = useState(false); // 업로드 진행 상태
    const [uploadError, setUploadError] = useState(null); // 업로드 에러 상태
    const navigate = useNavigate();
    const MAX_IMAGES = 3; // 이미지 최대 개수
    const MAX_FILES = 3; // 파일 최대 개수
    const ALLOWED_FILE_EXTENSIONS = ['.txt', '.md', '.doc', '.docx']; // 텍스트 파일 확장자 제한

    // 페이지 로드 시 빈 Portfolio 생성 및 ID 발급
    useEffect(() => {
        const checkAuthAndFetchPortfolioId = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                navigate('/login');
                return;
            }

            try {
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/portfolios`, {}, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });

                // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
                if (response.status === 401) {
                    navigate('/login');
                    return;
                }

                if (response.data.success_or_fail) {
                    setPortfolioId(response.data.data); // 반환된 ID 저장
                } else {
                    throw new Error(response.data.message || '포트폴리오 ID 생성 실패');
                }
            } catch (err) {
                setUploadError('포트폴리오 생성 중 오류가 발생했습니다: ' + err.message);
                if (err.response?.status === 401) {
                    navigate('/login');
                    return;
                }
            }
        };

        checkAuthAndFetchPortfolioId();
    }, [navigate]);

    // 이미지 입력 필드 클릭 시 제한 확인
    const handleImageInputClick = (event) => {
        if (images.length >= MAX_IMAGES) {
            event.preventDefault();
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
        }
    };

    // 파일 입력 필드 클릭 시 제한 확인
    const handleFileInputClick = (event) => {
        if (files.length >= MAX_FILES) {
            event.preventDefault();
            alert(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
        }
    };

    // 이미지 선택 핸들러 (Presigned URL 받아서 S3 업로드)
    const handleImageChange = async (event) => {
        const newImages = Array.from(event.target.files).filter(file => file.type.startsWith('image/')); // 이미지 파일만 필터링

        if (images.length + newImages.length > MAX_IMAGES) {
            alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newImages.map(async (file) => {
                if (!portfolioId) {
                    throw new Error('포트폴리오 ID가 설정되지 않았습니다.');
                }

                // Presigned URL 및 PortfolioFile ID 요청 (이미지)
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: `${process.env.REACT_APP_S3_PORTFOLIO_DIRECTORY}`, // 포트폴리오 디렉토리 (환경 변수로 정의)
                    id: portfolioId,
                    file_type: `${process.env.REACT_APP_S3_IMAGE_TYPE}`, // 이미지 타입 (환경 변수로 정의)
                    file_name: file.name,
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json',
                    },
                });

                // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
                if (presignedResponse.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const fileEntityId = presignedResponse.data.data.image_entity_id; // 이미지 엔티티 ID

                // S3에 파일 업로드
                await axios.put(presignedUrl, file, {
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                });

                return { file, entityId: fileEntityId }; // 파일 객체와 엔티티 ID 반환
            });

            const uploadedImages = await Promise.all(uploadPromises);
            // 중복이나 누락 방지를 위해 기존 images에서 entityId를 기준으로 중복 제거
            const uniqueImages = [...images, ...uploadedImages].filter((item, index, self) =>
                index === self.findIndex((t) => t.entityId === item.entityId)
            );
            setImages(uniqueImages.slice(0, MAX_IMAGES)); // 중복 제거 후 최대 개수로 슬라이싱
        } catch (err) {
            setUploadError('이미지 업로드 실패: ' + (err.response?.data?.message || err.message));
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    // 파일 선택 핸들러 (Presigned URL 받아서 S3 업로드)
    const handleFileChange = async (event) => {
        const newFiles = Array.from(event.target.files).filter(file => {
            const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
            return ALLOWED_FILE_EXTENSIONS.includes(extension);
        }); // 텍스트 파일만 필터링

        if (files.length + newFiles.length > MAX_FILES) {
            alert(`파일은 최대 ${MAX_FILES}개까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newFiles.map(async (file) => {
                if (!portfolioId) {
                    throw new Error('포트폴리오 ID가 설정되지 않았습니다.');
                }

                // Presigned URL 및 PortfolioFile ID 요청 (파일)
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: `${process.env.REACT_APP_S3_PORTFOLIO_DIRECTORY}`, // 포트폴리오 디렉토리 (환경 변수로 정의)
                    id: portfolioId,
                    file_type: `${process.env.REACT_APP_S3_FILE_TYPE}`, // 파일 타입 (환경 변수로 정의)
                    file_name: file.name,
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json',
                    },
                });

                // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
                if (presignedResponse.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const fileEntityId = presignedResponse.data.data.image_entity_id; // 파일 엔티티 ID

                // S3에 파일 업로드
                await axios.put(presignedUrl, file, {
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                });

                return { file, entityId: fileEntityId }; // 파일 객체와 엔티티 ID 반환
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            // 중복이나 누락 방지를 위해 기존 files에서 entityId를 기준으로 중복 제거
            const uniqueFiles = [...files, ...uploadedFiles].filter((item, index, self) =>
                index === self.findIndex((t) => t.entityId === item.entityId && t.file.name === item.file.name)
            );
            setFiles(uniqueFiles.slice(0, MAX_FILES)); // 중복 제거 후 최대 개수로 슬라이싱
        } catch (err) {
            setUploadError('파일 업로드 실패: ' + (err.response?.data?.message || err.message));
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    // 이미지/파일 삭제 핸들러 (로컬 상태만 업데이트, S3 및 DB 삭제 요청 X)
    const handleImageRemove = (index) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleFileRemove = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    // 폼 제출 핸들러 (JSON 형식으로 포트폴리오 등록, portfolioFileIds 포함)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!portfolioId) {
            setUploadError('포트폴리오 ID를 가져오지 못했습니다. 다시 시도해주세요.');
            return;
        }

        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            navigate('/login');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            // 현재 업로드된 이미지와 파일의 엔티티 ID 수집
            const portfolioFileIds = [
                ...images.map(item => item.entityId), // 이미지 엔티티 ID
                ...files.map(item => item.entityId),  // 파일 엔티티 ID
            ].filter(id => id); // 빈 값 필터링

            const requestData = {
                "title": title,
                "content": content,
                "portfolio_file_ids": portfolioFileIds, // 이미지와 파일 엔티티 ID를 합쳐서 보냄
            };

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/portfolios/${portfolioId}/registration`, requestData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            // 401 에러 처리: accessToken 만료 시 로그인 페이지로 리다이렉션
            if (response.status === 401) {
                navigate('/login');
                return;
            }

            if (response.data.success_or_fail) {
                navigate('/profile'); // 포트폴리오 작성 후 프로필 페이지로 이동
            } else {
                throw new Error(response.data.message || '포트폴리오 저장 실패');
            }
        } catch (err) {
            setUploadError('포트폴리오 작성 중 오류가 발생했습니다: ' + err.message);
            if (err.response?.status === 401) {
                navigate('/login');
                return;
            }
        } finally {
            setUploading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontSize: '24px', // 기본 폰트 크기 유지
                    color: '#e50914', // 넷플릭스 레드 컬러
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                }}
            >
                <FolderIcon sx={{ color: '#e50914' }} /> 포트폴리오 작성
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                <TextField
                    fullWidth
                    label="제목 *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    margin="normal"
                    required
                />
                <TextField
                    fullWidth
                    label="설명 *"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    margin="normal"
                    multiline
                    rows={6} // content 입력 박스를 더 길게
                    required
                />
                <Box sx={{ mt: 2 }}>
                    {/* 이미지 첨부 버튼 (파란색) */}
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<AddPhotoAlternateIcon />}
                        sx={{ mb: 2, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
                    >
                        이미지 선택
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            hidden
                            onChange={handleImageChange}
                            onClick={handleImageInputClick}
                        />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {images.length === 0 ? '선택된 이미지 없음' : `선택된 이미지: ${images.length}/${MAX_IMAGES}`}
                    </Typography>
                    <ImageList sx={{ width: '100%', mt: 2 }} cols={Math.min(images.length || 1, 3)} rowHeight={500}>
                        {images.map((image, index) => (
                            <ImageListItem key={image.name}>
                                <img
                                    src={URL.createObjectURL(image.file)}
                                    alt={image.name}
                                    loading="lazy"
                                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                />
                                <ImageListItemBar
                                    sx={{
                                        background: 'rgba(0, 0, 0, 0.5)',
                                        position: 'absolute',
                                        top: 0,
                                        right: 0,
                                    }}
                                    actionIcon={
                                        <IconButton
                                            sx={{ color: 'white' }}
                                            onClick={() => handleImageRemove(index)}
                                            aria-label={`삭제 ${image.name}`}
                                        >
                                            <CloseIcon />
                                        </IconButton>
                                    }
                                />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </Box>
                <Box sx={{ mt: 2 }}>
                    {/* 파일 첨부 버튼 (주황색) */}
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<DescriptionIcon />}
                        sx={{ mb: 2, backgroundColor: '#ff9800', '&:hover': { backgroundColor: '#f57c00' } }}
                    >
                        파일 선택
                        <input
                            type="file"
                            accept={ALLOWED_FILE_EXTENSIONS.join(',')} // 텍스트 파일 확장자만 허용
                            multiple
                            hidden
                            onChange={handleFileChange}
                            onClick={handleFileInputClick}
                        />
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                        {files.length === 0 ? '선택된 파일 없음' : `선택된 파일: ${files.length}/${MAX_FILES}`}
                    </Typography>
                    {/* 파일을 텍스트 형태로 간결하게 표시, 삭제 버튼(X) 추가 */}
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {files.map((file, index) => (
                            <Box key={file.name} sx={{
                                display: 'flex',
                                alignItems: 'center',
                                p: 0.25,
                                border: '1px solid #ddd',
                                borderRadius: 1,
                                backgroundColor: '#f5f5f5', // 약간의 배경색 추가
                                maxWidth: 180, // 파일 이름 길이를 더 줄여 공간 최소화
                            }}>
                                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1, pr: 0.25, fontSize: 14 }}>
                                    {file.file.name} {/* 파일 이름이 올바르게 표시되도록 수정 */}
                                </Typography>
                                <IconButton
                                    sx={{ color: 'gray', p: 0.25 }}
                                    onClick={() => handleFileRemove(index)}
                                    aria-label={`삭제 ${file.file.name}`}
                                >
                                    <CloseIcon sx={{ fontSize: 14 }} /> {/* 삭제 버튼 크기 더 작게 조정 */}
                                </IconButton>
                            </Box>
                        ))}
                    </Box>
                </Box>
                {uploading && <CircularProgress sx={{ mt: 2 }} />}
                {uploadError && (
                    <Typography variant="body1" color="error.main" sx={{ mt: 2 }}>
                        {uploadError}
                    </Typography>
                )}
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }} disabled={uploading}>
                    작성
                </Button>
            </Box>
        </div>
    );
}

export default CreatePortfolio;