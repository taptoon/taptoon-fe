import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    TextField,
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
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import EditIcon from '@mui/icons-material/Edit';
import CancelIcon from '@mui/icons-material/Cancel';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import axios from 'axios';
import './EditMatchingPost.css';

const theme = createTheme({
    palette: {
        primary: { main: '#1976d2' },
        secondary: { main: '#f50057' },
        green: { main: '#4CAF50' },
        red: { main: '#f44336' },
    },
});

function EditMatchingPost() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const post = location.state?.post ? { ...location.state.post } : null;

    const [title, setTitle] = useState(post?.title || '');
    const [description, setDescription] = useState(post?.description || '');
    const [artistType, setArtistType] = useState(post?.artist_type || 'WRITER');
    const [workType, setWorkType] = useState(post?.work_type || 'HYBRID');
    const [images, setImages] = useState([]); // 새로 업로드된 이미지 파일 상태
    const [existingImages, setExistingImages] = useState(
        post?.image_list?.map(item => ({
            id: item.id,
            matchingPostId: item.matching_post_id,
            thumbnailImageUrl: item.thumbnail_image_url,
            originalImageUrl: item.original_image_url,
        })) || []
    );
    const [matchingPostImageIds, setMatchingPostImageIds] = useState([]); // 새로 추가된 이미지 ID 상태
    const [deletedImageIds, setDeletedImageIds] = useState([]); // 삭제된 이미지 ID 상태
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const MAX_FILES = 3;

    useEffect(() => {
        if (!post) {
            setUploadError('게시글 데이터를 가져오지 못했습니다.');
        } else {
            console.log('Post data in EditMatchingPost:', post);
        }
    }, [post]);

    // 유효한 이미지 수 계산 (삭제된 이미지를 제외)
    const getValidImageCount = () => {
        const validExistingImages = existingImages.filter(img => !deletedImageIds.includes(img.id)).length;
        return validExistingImages + images.length;
    };

    const handleFileInputClick = (event) => {
        const totalImages = getValidImageCount();
        if (totalImages >= MAX_FILES) {
            event.preventDefault();
            alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
        }
    };

    const handleImageUpload = async (event) => {
        const newFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
        const totalImages = getValidImageCount();

        if (totalImages + newFiles.length > MAX_FILES) {
            alert(`이미지는 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.`);
            return;
        }

        setUploading(true);
        setUploadError(null);

        try {
            const uploadPromises = newFiles.map(async (file) => {
                const presignedResponse = await axios.post(`${process.env.REACT_APP_API_URL}/images/upload`, {
                    directory: `${process.env.REACT_APP_S3_MATCHING_POST_DIRECTORY}`,
                    id: id,
                    file_type: `${process.env.REACT_APP_S3_IMAGE_TYPE}`,
                    file_name: file.name,
                }, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`, 'Content-Type': 'application/json' },
                });

                if (!presignedResponse.data.success_or_fail) {
                    throw new Error(presignedResponse.data.message || 'Presigned URL 요청 실패');
                }

                const presignedUrl = presignedResponse.data.data.uploading_image_url;
                const imageEntityId = presignedResponse.data.data.image_entity_id;

                await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type || 'application/octet-stream' } });

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

    const handleExistingImageRemove = (imageUrl, imageIndex) => {
        setUploading(true);
        setUploadError(null);

        try {
            const imageId = existingImages[imageIndex].id;

            // API 호출 대신 deletedImageIds에 imageId 추가
            setDeletedImageIds((prev) => [...prev, imageId]);

            // existingImages에서 해당 인덱스의 이미지 제거
            setExistingImages((prev) => prev.filter((_, i) => i !== imageIndex));
        } catch (err) {
            setUploadError('기존 이미지 삭제 처리 중 오류 발생: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleNewImageRemove = (index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setMatchingPostImageIds(prevIds => prevIds.filter((_, i) => i !== index));
    };

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
            const validImageIds = [
                ...existingImages.filter(img => !deletedImageIds.includes(img.id)).map(img => img.id),
                ...matchingPostImageIds,
            ];

            const requestData = {
                title,
                description,
                artist_type: artistType,
                work_type: workType,
                valid_image_ids: validImageIds,
                deleted_image_ids: deletedImageIds,
            };

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/matching-posts/${id}`, requestData, {
                headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            });

            // 204 No Content인 경우 본문이 없으므로 json() 호출하지 않음
            if (response.status === 204) {
                console.log('수정 성공');
                alert('매칭 포스트가 성공적으로 수정되었습니다.');
                navigate(`/matching-posts/${id}`);
                return;
            }

            if (!response.ok) {
                throw new Error('매칭 포스트 수정 실패');
            }

            // 다른 상태 코드(예: 200)일 경우 JSON 파싱
            const result = await response.json();
            if (result.success_or_fail) {
                console.log('success');
                alert('매칭 포스트가 성공적으로 수정되었습니다.');
                navigate(`/matching-posts/${id}`);
            } else {
                throw new Error(result.message || '매칭 포스트 수정 실패');
            }
        } catch (err) {
            setUploadError('매칭 포스트 수정 중 오류가 발생했습니다: ' + err.message);
            console.error('수정 오류:', err);
        } finally {
            setUploading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('수정을 취소하시겠습니까?')) {
            navigate(-1);
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
                            {getValidImageCount() === 0 ? '선택된 이미지 없음' : `선택된 이미지: ${getValidImageCount()}/${MAX_FILES}`}
                        </Typography>
                        <ImageList sx={{ width: '100%', mt: 2 }} cols={Math.min(getValidImageCount() || 1, 3)} rowHeight={500}>
                            {existingImages.filter(img => !deletedImageIds.includes(img.id)).map((image, index) => (
                                <ImageListItem key={`existing-${index}`}>
                                    <img
                                        src={image.originalImageUrl}
                                        alt={`기존 이미지 ${index + 1}`}
                                        loading="lazy"
                                        onError={(e) => { e.target.src = 'https://picsum.photos/500/500?text=Image+Not+Found'; }}
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
                                                onClick={() => handleExistingImageRemove(image.originalImageUrl, index)}
                                                aria-label={`기존 이미지 삭제 ${index + 1}`}
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        }
                                    />
                                </ImageListItem>
                            ))}
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
                        {getValidImageCount() > 0 && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                                업로드된 이미지 파일명: {[
                                ...existingImages.filter(img => !deletedImageIds.includes(img.id)).map(img => img.originalImageUrl?.split('/').pop() || ''),
                                ...images.map(file => file.name)
                            ].join(', ')}
                            </Typography>
                        )}
                        {uploading && <CircularProgress sx={{ mt: 2 }} />}
                        {uploadError && <Typography variant="body1" color="error.main" sx={{ mt: 2 }}>{uploadError}</Typography>}
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