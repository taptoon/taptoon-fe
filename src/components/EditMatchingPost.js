import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    TextField,
    Button,
    Box,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
    CircularProgress,
    Fab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate'; // 이미지 아이콘 (녹색용)
import EditIcon from '@mui/icons-material/Edit'; // 수정 아이콘
import CancelIcon from '@mui/icons-material/Cancel'; // 취소 아이콘
import { ThemeProvider, createTheme } from '@mui/material/styles'; // ThemeProvider 및 createTheme 임포트
import axios from 'axios';
import './EditMatchingPost.css';

const theme = createTheme({
    palette: {
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#f50057',
        },
        green: {
            main: '#4CAF50', // 초록색 (채팅 및 수정 버튼용)
        },
        red: {
            main: '#f44336', // 빨간색 (삭제 버튼용)
        },
    },
});

function EditMatchingPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const post = location.state?.post; // MatchingPostDetail에서 전달된 데이터

    const [title, setTitle] = useState(post?.title || '');
    const [description, setDescription] = useState(post?.description || '');
    const [artistType, setArtistType] = useState(post?.artist_type || 'WRITER');
    const [workType, setWorkType] = useState(post?.work_type || 'HYBRID');
    const [images, setImages] = useState([]); // 업로드된 새 이미지 파일 상태
    const [existingImages, setExistingImages] = useState(post?.image_list || []); // 기존 이미지 URL 상태
    const [matchingPostImageIds, setMatchingPostImageIds] = useState([]); // 새로 업로드된 이미지 ID 상태
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const MAX_FILES = 3; // 총 이미지 수 제한 (기존 + 새 이미지)

    useEffect(() => {
        if (!post) {
            setUploadError('게시글 데이터를 가져오지 못했습니다.');
        }
    }, [post]);

    // 파일 입력 필드 클릭 시 이미지 제한 확인 (기존 + 새 이미지)
    const handleFileInputClick = (event) => {
        const totalImages = existingImages.length + images.length;
        if (totalImages >= MAX_FILES) {
            event.preventDefault();
            alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
        }
    };

    // 새 이미지 업로드 핸들러 (Presigned URL 받아서 S3 업로드)
    const handleImageUpload = async (event) => {
        const newFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
        const totalImages = existingImages.length + images.length;

        if (totalImages + newFiles.length > MAX_FILES) {
            alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newFiles.map(async (file) => {
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: 'matchingpost',
                    id,
                    file_name: file.name,
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const imageEntityId = presignedResponse.data.data.image_entity_id;

                await axios.put(presignedUrl, file, {
                    headers: {
                        'Content-Type': file.type || 'application/octet-stream',
                    },
                });

                setMatchingPostImageIds(prevIds => [...prevIds, imageEntityId]);
                return file;
            });

            const uploadedFiles = await Promise.all(uploadPromises);
            setImages(prev => [...prev, ...uploadedFiles]);
        } catch (err) {
            setUploadError('이미지 업로드 실패: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    // 기존 이미지 취소 핸들러 (S3 및 DB에서 삭제)
    const handleExistingImageRemove = async (imageUrl, imageIndex) => {
        setUploading(true);
        setUploadError(null);

        try {
            const imageId = existingImages[imageIndex].id; // image_list에 id가 있다고 가정
            await axios.delete(`${process.env.REACT_APP_API_URL}/matching-posts/images/${imageId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                },
            });

            setExistingImages(prev => prev.filter((_, i) => i !== imageIndex));
        } catch (err) {
            setUploadError('기존 이미지 삭제 실패: ' + (err.response?.data?.message || err.message));
        } finally {
            setUploading(false);
        }
    };

    // 새 이미지 취소 핸들러
    const handleNewImageRemove = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setMatchingPostImageIds(prevIds => prevIds.filter((_, i) => i !== index));
    };

    // 폼 제출 핸들러 (PUT 요청으로 수정)
    const handleSubmit = async (e) => {
        e.preventDefault();
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            navigate('/login');
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const requestData = {
                title,
                description,
                artist_type: artistType,
                work_type: workType,
                matching_post_image_ids: [
                    ...existingImages.map(img => img.id), // 기존 이미지 ID
                    ...matchingPostImageIds, // 새로 업로드된 이미지 ID
                ],
            };

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`, requestData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success_or_fail) {
                navigate(`/matching-posts/${id}`); // 수정 후 상세 페이지로 이동
            } else {
                throw new Error(response.data.message || '매칭 포스트 수정 실패');
            }
        } catch (err) {
            setUploadError('매칭 포스트 수정 중 오류가 발생했습니다: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    // 취소 처리 함수
    const handleCancel = () => {
        if (window.confirm('수정을 취소하시겠습니까?')) {
            navigate(-1); // 이전 페이지로 돌아감
        }
    };

    if (uploadError) return <div>오류: {uploadError}</div>;
    if (!post) return <div>게시글 데이터를 찾을 수 없습니다.</div>;

    return (
        <ThemeProvider theme={theme}>
            <div className="edit-matching-post-container">
                <Typography variant="h4" gutterBottom>매칭 포스트 수정</Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, maxWidth: '800px', margin: '0 auto' }}>
                    <TextField
                        fullWidth
                        label="제목 *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        margin="normal"
                        required
                        variant="outlined"
                        sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                    />
                    <TextField
                        fullWidth
                        label="설명 *"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        margin="normal"
                        multiline
                        rows={4}
                        required
                        variant="outlined"
                        sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                    />
                    <FormControl fullWidth margin="normal" variant="outlined">
                        <InputLabel id="artist-type-label">작가 타입 *</InputLabel>
                        <Select
                            labelId="artist-type-label"
                            value={artistType}
                            onChange={(e) => setArtistType(e.target.value)}
                            label="작가 타입"
                            sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                        >
                            <MenuItem value="WRITER">글작가</MenuItem>
                            <MenuItem value="ILLUSTRATOR">그림작가</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth margin="normal" variant="outlined">
                        <InputLabel id="work-type-label">업무 형태 *</InputLabel>
                        <Select
                            labelId="work-type-label"
                            value={workType}
                            onChange={(e) => setWorkType(e.target.value)}
                            label="업무 형태"
                            sx={{ backgroundColor: '#fff', borderRadius: 1 }}
                        >
                            <MenuItem value="ONLINE">온라인</MenuItem>
                            <MenuItem value="OFFLINE">오프라인</MenuItem>
                            <MenuItem value="HYBRID">하이브리드</MenuItem>
                        </Select>
                    </FormControl>
                    <Box sx={{ mt: 2 }}>
                        <Fab
                            variant="extended"
                            color="green"
                            component="label"
                            startIcon={<AddPhotoAlternateIcon />}
                            sx={{ backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45a049' }, mb: 2 }}
                        >
                            이미지 추가
                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                hidden
                                onChange={handleImageUpload}
                                onClick={handleFileInputClick}
                            />
                        </Fab>
                        <Typography variant="body2" color="text.secondary">
                            {existingImages.length + images.length === 0 ? '선택된 이미지 없음' : `선택된 이미지: ${existingImages.length + images.length}/${MAX_FILES}`}
                        </Typography>
                        <ImageList sx={{ width: '100%', mt: 2 }} cols={Math.min((existingImages.length + images.length) || 1, 3)} rowHeight={500}>
                            {/* 기존 이미지 표시 (취소 가능) */}
                            {existingImages.map((image, index) => (
                                <ImageListItem key={`existing-${index}`}>
                                    <img
                                        src={image.image_url}
                                        alt={`기존 이미지 ${index + 1}`}
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
                                                onClick={() => handleExistingImageRemove(image.image_url, index)}
                                                aria-label={`기존 이미지 삭제 ${index + 1}`}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        }
                                    />
                                </ImageListItem>
                            ))}
                            {/* 새로 추가된 이미지 표시 (취소 가능) */}
                            {images.map((file, index) => (
                                <ImageListItem key={`new-${index}`}>
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`새 이미지 ${index + 1}`}
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
                                                onClick={() => handleNewImageRemove(index)}
                                                aria-label={`새 이미지 삭제 ${index + 1}`}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        }
                                    />
                                </ImageListItem>
                            ))}
                        </ImageList>
                        {(existingImages.length > 0 || images.length > 0) && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                업로드된 이미지 파일명: {[...existingImages.map(img => img.image_url.split('/').pop()), ...images.map(file => file.name)].join(', ')}
                            </Typography>
                        )}
                        {uploading && <CircularProgress sx={{ mt: 2 }} />}
                        {uploadError && (
                            <Typography variant="body1" color="error.main" sx={{ mt: 2 }}>
                                {uploadError}
                            </Typography>
                        )}
                    </Box>
                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Fab
                            color="red"
                            aria-label="cancel"
                            sx={{
                                backgroundColor: theme.palette.red.main,
                                '&:hover': { backgroundColor: '#d32f2f', transform: 'scale(1.05)' },
                                borderRadius: '50%',
                            }}
                            onClick={handleCancel}
                        >
                            <CancelIcon sx={{ color: '#fff' }} />
                        </Fab>
                        <Fab
                            type="submit"
                            color="green"
                            aria-label="submit"
                            sx={{
                                backgroundColor: theme.palette.green.main,
                                '&:hover': { backgroundColor: '#45a049', transform: 'scale(1.05)' },
                                borderRadius: '50%',
                            }}
                        >
                            <EditIcon sx={{ color: '#fff' }} />
                        </Fab>
                    </Box>
                </Box>
            </div>
        </ThemeProvider>
    );
}

export default EditMatchingPost;