import React, { useState, useRef, useMemo, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Context } from '../../main';
import useFetch from '../../hooks/useFetch';
import { useNotification } from '../../hooks/useNotification';
import { hasOnlyAllowedParams, validateFilters, fetchFunction } from '../../utils/function';
import { generateIcon, iconMap } from '../../utils/constants';
import Table from "../../components/common/Table/Table";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import Select from "../../components/common/Select/Select";
import Pagination from "../../components/common/Pagination/Pagination";
import Dropdown from "../../components/common/Dropdown/Dropdown";
import PageError from "../ErrorPage/PageError";
import SkeletonPage from "../../components/common/Skeleton/SkeletonPage";
import Modal from "../../components/common/Modal/Modal";
import { Transition } from "react-transition-group";
import classNames from "classnames";

// ── іконки ─────────────────────────────────────────────────────────────────
const filterIcon = generateIcon(iconMap.filter);
const searchIcon = generateIcon(iconMap.search, 'input-icon');
const editIcon = generateIcon(iconMap.edit);
const viewIcon = generateIcon(iconMap.view);
const arrowUpIcon = generateIcon(iconMap.arrowUp, 'table-sort-icon');
const arrowDownIcon = generateIcon(iconMap.arrowDown, 'table-sort-icon');
const dropDownIcon = generateIcon(iconMap.arrowDown);

const dropDownStyle = { width: '100%' };

const KindergartenGroups = () => {
    const navigate = useNavigate();
    const notification = useNotification();
    const { store } = useContext(Context);
    const nodeRef = useRef(null);
    const modalNodeRef = useRef(null);

    // ── стан ────────────────────────────────────────────────────────────────────
    const [stateKindergarten, setStateKindergarten] = useState({
        isFilterOpen: false,
        selectData: {},
        confirmLoading: false,
        itemId: null,
        sendData: { 
            limit: 16, 
            page: 1, 
            sort_by: 'id', 
            sort_direction: 'desc' 
        },
    });

    // стан для модального вікна
    const [modalState, setModalState] = useState({
        isOpen: false,
        loading: false,
        formData: {
            kindergarten_name: '',
            group_name: '',
            group_type: ''
        }
    });

    const isFirstRun = useRef(true);

    const { error, status, data, retryFetch } = useFetch(
        'api/kindergarten/groups/filter',
        { method: 'post', data: stateKindergarten.sendData },
    );

    const startRecord = ((stateKindergarten.sendData.page || 1) - 1) * stateKindergarten.sendData.limit + 1;
    const endRecord = Math.min(
        startRecord + stateKindergarten.sendData.limit - 1,
        data?.totalItems || 1,
    );

    // ── повторне завантаження при зміні параметрів ───────────────────────────────
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        retryFetch('api/kindergarten/groups/filter', {
            method: 'post',
            data: stateKindergarten.sendData,
        });
    }, [stateKindergarten.sendData, retryFetch]);

    // ── обробка сортування ──────────────────────────────────────────────────────
    const handleSort = (column) => {
        const currentSortBy = stateKindergarten.sendData.sort_by;
        const currentDirection = stateKindergarten.sendData.sort_direction;
        
        let newDirection = 'asc';
        if (currentSortBy === column && currentDirection === 'asc') {
            newDirection = 'desc';
        }

        setStateKindergarten(prev => ({
            ...prev,
            sendData: {
                ...prev.sendData,
                sort_by: column,
                sort_direction: newDirection,
                page: 1
            }
        }));
    };

    const getSortIcon = (column) => {
        if (stateKindergarten.sendData.sort_by !== column) return null;
        return stateKindergarten.sendData.sort_direction === 'asc' ? arrowUpIcon : arrowDownIcon;
    };

    // ── функція для створення сортируемих колонок ────────────────────────────────
    const createSortableColumn = (title, dataIndex, render = null, width = null) => ({
        title: (
            <span 
                onClick={() => handleSort(dataIndex)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
                className="sortable-header"
            >
                {title} {getSortIcon(dataIndex)}
            </span>
        ),
        dataIndex,
        headerClassName: stateKindergarten.sendData.sort_by === dataIndex ? 'active' : '',
        ...(width && { width }),
        ...(render && { render })
    });

    // ── хендлери фільтрів / пагінації ───────────────────────────────────────────
    const filterHandleClick = () =>
        setStateKindergarten((prev) => ({ ...prev, isFilterOpen: !prev.isFilterOpen }));

    const onHandleChange = (name, value) =>
        setStateKindergarten((prev) => ({
            ...prev,
            selectData: { ...prev.selectData, [name]: value },
        }));

    // функції для модального вікна ──────────────────────────────────────
    const openModal = () => {
        setModalState(prev => ({
            ...prev,
            isOpen: true,
            formData: {
                kindergarten_name: '',
                group_name: '',
                group_type: ''
            }
        }));
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setModalState(prev => ({ ...prev, isOpen: false }));
        document.body.style.overflow = 'auto';
    };

    const handleModalInputChange = (field, value) => {
        setModalState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [field]: value
            }
        }));
    };

    const handleSaveGroup = async () => {
        const { kindergarten_name, group_name, group_type } = modalState.formData;
        
        // Валідація
        if (!kindergarten_name.trim() || !group_name.trim() || !group_type) {
            notification({
                type: 'warning',
                placement: 'top',
                title: 'Помилка',
                message: 'Будь ласка, заповніть всі поля',
            });
            return;
        }

        setModalState(prev => ({ ...prev, loading: true }));

        try {
            await fetchFunction('api/kindergarten/groups', {
                method: 'POST',
                data: {
                    kindergarten_name: kindergarten_name.trim(),
                    group_name: group_name.trim(),
                    group_type
                }
            });

            notification({
                type: 'success',
                placement: 'top',
                title: 'Успіх',
                message: 'Групу успішно додано',
            });

            closeModal();
            
            // Оновлюємо список
            retryFetch('api/kindergarten/groups/filter', {
                method: 'post',
                data: stateKindergarten.sendData,
            });

        } catch (error) {
            notification({
                type: 'error',
                placement: 'top',
                title: 'Помилка',
                message: error.message || 'Не вдалося додати групу',
            });
        } finally {
            setModalState(prev => ({ ...prev, loading: false }));
        }
    };

    const resetFilters = () => {
        if (Object.values(stateKindergarten.selectData).some(Boolean)) {
            setStateKindergarten((prev) => ({ ...prev, selectData: {} }));
        }
        if (!hasOnlyAllowedParams(stateKindergarten.sendData, ['limit', 'page', 'sort_by', 'sort_direction'])) {
            setStateKindergarten((prev) => ({
                ...prev,
                sendData: { 
                    limit: prev.sendData.limit, 
                    page: 1,
                    sort_by: 'id',
                    sort_direction: 'desc'
                },
                isFilterOpen: false
            }));
        }
    };

    const applyFilter = () => {
        const isAnyInputFilled = Object.values(stateKindergarten.selectData).some((v) =>
            Array.isArray(v) ? v.length : v,
        );
        if (!isAnyInputFilled) return;

        const validation = validateFilters(stateKindergarten.selectData);
        if (!validation.error) {
            setStateKindergarten((prev) => ({
                ...prev,
                sendData: { 
                    ...prev.sendData,
                    ...validation, 
                    page: 1,
                },
                isFilterOpen: false
            }));
        } else {
            notification({
                type: 'warning',
                placement: 'top',
                title: 'Помилка',
                message: validation.message ?? 'Щось пішло не так.',
            });
        }
    };

    const handlePaginationChange = (page) => {
        setStateKindergarten((prev) => ({
            ...prev,
            sendData: { ...prev.sendData, page },
        }));
    };

    // ── колонки таблиці ─────────────────────────────────────────────────────────
    const columnTable = useMemo(() => {
        let columns = [
            createSortableColumn('Назва садочка', 'kindergarten_name', null, '200px'),
            createSortableColumn('Назва групи', 'group_name', null, '150px'),
            createSortableColumn('Тип групи', 'group_type', (value) => {
                const typeLabels = {
                    'young': 'Молодша',
                    'older': 'Старша'
                };
                return (
                    <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: value === 'young' ? '#e6f7ff' : '#f6ffed',
                        color: value === 'young' ? '#1890ff' : '#52c41a',
                        fontSize: '12px',
                        fontWeight: 'bold'
                    }}>
                        {typeLabels[value] || value}
                    </span>
                );
            }, '120px'),
            {
                title: 'Дія',
                dataIndex: 'action',
                headerClassName: 'non-sortable',
                width: '100px',
                render: (_, record) => (
                    <div className="btn-sticky" style={{
                        justifyContent: 'center', 
                        gap: '4px', 
                        flexWrap: 'wrap'
                    }}>
                        <Button
                            title="Переглянути"
                            icon={viewIcon}
                            size="small"
                            onClick={() => alert(`Перегляд групи: ${record.group_name}`)}
                        />
                        <Button
                            title="Редагувати"
                            icon={editIcon}
                            size="small"
                            onClick={() => alert(`Редагування групи: ${record.group_name}`)}
                        />
                    </div>
                ),
            }
        ];

        return columns;
    }, [handleSort, getSortIcon, stateKindergarten.sendData.sort_by, stateKindergarten.sendData.sort_direction]);

    // ── дані для таблиці ────────────────────────────────────────────────────────
    const tableData = useMemo(() => {
        if (data?.items?.length) {
            return data.items.map((el) => ({
                key: el.id,
                id: el.id,
                kindergarten_name: el.kindergarten_name,
                group_name: el.group_name,
                group_type: el.group_type,
            }));
        }
        return [];
    }, [data]);

    // ── меню вибору "записів на сторінку" ────────────────────────────────────────
    const itemMenu = [
        ...[16, 32, 48].map((limit) => ({
            label: String(limit),
            key: String(limit),
            onClick: () => {
                if (stateKindergarten.sendData.limit !== limit) {
                    setStateKindergarten((prev) => ({
                        ...prev,
                        sendData: { ...prev.sendData, limit, page: 1 },
                    }));
                }
            },
        })),
    ];

    // ── опції фільтрів ──────────────────────────────────────────────────────────
    const groupTypeOptions = [
        { value: '', label: 'Всі типи' },
        { value: 'young', label: 'Молодша' },
        { value: 'older', label: 'Старша' }
    ];

    // ── рендер ──────────────────────────────────────────────────────────────────
    if (status === 'Loading') {
        return <SkeletonPage />;
    }

    if (status === 'Error') {
        return (
            <PageError
                title="Схоже, сталася помилка при завантаженні даних."
                statusError={error?.status}
            />
        );
    }

    return (
        <>
            <div className="main-content__header">
                <h2 className="title title--lg">Групи садочків</h2>
            </div>

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: '20px' 
            }}>
                <div>
                    <span>Показано {startRecord}-{endRecord} з {data?.totalItems || 0} записів</span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Button
                        onClick={openModal}
                        className="btn--primary"
                    >
                        Додати групу
                    </Button>
                    
                    <Dropdown
                        items={itemMenu}
                        trigger="click"
                        placement="bottomLeft"
                    >
                        <Button>
                            Записів: {stateKindergarten.sendData.limit} {dropDownIcon}
                        </Button>
                    </Dropdown>
                    
                    <Button
                        icon={filterIcon}
                        onClick={filterHandleClick}
                        className={stateKindergarten.isFilterOpen ? 'btn--active' : ''}
                    >
                        Фільтри
                    </Button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', position: 'relative' }}>
                <div style={{ flex: 1 }}>
                    <Table
                        columns={columnTable}
                        dataSource={tableData}
                        pagination={false}
                        size="small"
                    />

                    {data?.totalPages > 1 && (
                        <div className="main-content__pagination" style={{ marginTop: '20px' }}>
                            <Pagination
                                current={stateKindergarten.sendData.page}
                                total={data?.totalItems || 0}
                                pageSize={stateKindergarten.sendData.limit}
                                onChange={handlePaginationChange}
                                showSizeChanger={false}
                                showQuickJumper
                                showTotal={(total, range) =>
                                    `${range[0]}-${range[1]} з ${total} записів`
                                }
                            />
                        </div>
                    )}
                </div>

                {stateKindergarten.isFilterOpen && (
                    <div style={{
                        width: '320px',
                        backgroundColor: '#fff',
                        border: '1px solid #e8e8e8',
                        borderRadius: '8px',
                        padding: '20px',
                        height: 'fit-content',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Фільтри</h3>
                            <Button 
                                onClick={filterHandleClick}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                ×
                            </Button>
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Назва садочка
                            </label>
                            <Input
                                icon={searchIcon}
                                placeholder="Введіть назву садочка"
                                value={stateKindergarten.selectData.kindergarten_name || ''}
                                onChange={(e) => onHandleChange('kindergarten_name', e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Назва групи
                            </label>
                            <Input
                                icon={searchIcon}
                                placeholder="Введіть назву групи"
                                value={stateKindergarten.selectData.group_name || ''}
                                onChange={(e) => onHandleChange('group_name', e.target.value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ 
                                display: 'block', 
                                marginBottom: '8px', 
                                fontSize: '14px',
                                fontWeight: '500'
                            }}>
                                Тип групи
                            </label>
                            <Select
                                placeholder="Всі типи групи"
                                options={groupTypeOptions}
                                value={stateKindergarten.selectData.group_type || ''}
                                onChange={(value) => onHandleChange('group_type', value)}
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ 
                            display: 'flex', 
                            gap: '10px',
                            borderTop: '1px solid #e8e8e8',
                            paddingTop: '16px'
                        }}>
                            <Button 
                                onClick={resetFilters}
                                style={{ flex: 1 }}
                                className="btn--secondary"
                            >
                                Скинути
                            </Button>
                            <Button 
                                onClick={applyFilter}
                                style={{ flex: 1 }}
                                className="btn--primary"
                            >
                                Застосувати
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <Transition in={modalState.isOpen} timeout={200} unmountOnExit nodeRef={modalNodeRef}>
                {(state) => (
                    <Modal
                        className={state === 'entered' ? 'modal-window-wrapper--active' : ''}
                        onClose={closeModal}
                        onOk={handleSaveGroup}
                        confirmLoading={modalState.loading}
                        cancelText="Відхилити"
                        okText="Зберегти"
                        title="Додати нову групу садочка"
                    >
                        <div className="modal-form">
                            <div className="form-group">
                                <Input
                                    label="Назва садочка"
                                    placeholder="Введіть назву садочка"
                                    value={modalState.formData.kindergarten_name}
                                    onChange={(e) => handleModalInputChange('kindergarten_name', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <Input
                                    label="Назва групи"
                                    placeholder="Введіть назву групи"
                                    value={modalState.formData.group_name}
                                    onChange={(e) => handleModalInputChange('group_name', e.target.value)}
                                    required
                                />
                            </div>
                            
                            <div className="form-group">
                                <Select
                                    label="Тип групи"
                                    placeholder="Оберіть тип групи"
                                    options={[
                                        { value: 'young', label: 'Молодша' },
                                        { value: 'older', label: 'Старша' }
                                    ]}
                                    value={modalState.formData.group_type}
                                    onChange={(value) => handleModalInputChange('group_type', value)}
                                    style={dropDownStyle}
                                    required
                                />
                            </div>
                        </div>
                    </Modal>
                )}
            </Transition>
        </>
    );
};

export default KindergartenGroups;