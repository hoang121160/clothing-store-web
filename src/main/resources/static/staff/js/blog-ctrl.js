app.controller("blog-ctrl", function ($scope, $http) {
    $scope.items = [];
    $scope.form = {};
    $scope.formAdd = {};
    $scope.searchText = ''; // Thêm biến tìm kiếm
    $scope.pager = {
        page: 0,
        size: 5,
        items: [],
        count: 0,
        first: function () {
            this.page = 0;
            this.updateItems();
        },
        prev: function () {
            if (this.page > 0) {
                this.page--;
                this.updateItems();
            }
        },
        next: function () {
            if (this.page < this.count - 1) {
                this.page++;
                this.updateItems();
            }
        },
        last: function () {
            this.page = this.count - 1;
            this.updateItems();
        },
        updateItems: function () {
            const filteredItems = $scope.items.filter(item => {
                return item.id.toString().includes($scope.searchText) || // Lọc theo ID
                    item.ten.includes($scope.searchText); // Lọc theo tên
            });
            this.count = Math.ceil(filteredItems.length / this.size);
            this.items = filteredItems.slice(this.page * this.size, (this.page + 1) * this.size);
        }
    };

    // Hàm khởi tạo
    $scope.initialize = function () {
        // Tải danh sách thương hiệu
        $http.get("/rest/blog").then(resp => {
            console.log("Data from API: ", resp.data); // Kiểm tra dữ liệu từ API
            $scope.items = resp.data;
            $scope.items.forEach(item => {
                item.ngayTao = new Date(item.ngayTao); // Đổi tên trường nếu cần
                item.ngayCapNhat = new Date(item.ngayCapNhat); // Đổi tên trường nếu cần
                item.ngayBatDau = new Date(item.ngayBatDau); // Đổi tên trường nếu cần
                item.ngayKetThuc = new Date(item.ngayKetThuc); // Đổi tên trường nếu cần
            });
            $scope.pager.updateItems(); // Cập nhật các mục cho pager
        }).catch(error => {
            console.log("Error loading thuong hieu: ", error);
        });
    };

    // Theo dõi sự thay đổi trong ô tìm kiếm
    $scope.$watch('searchText', function (newValue, oldValue) {
        if (newValue !== oldValue) {
            $scope.pager.updateItems();
        }
    });
    // Khởi tạo
    $scope.initialize();

    // Reset
    $scope.reset = function () {
        // Giữ nguyên giá trị của id nếu có
        const currentId = $scope.form.id; // Lưu trữ giá trị ID hiện tại
        const ngayTao = $scope.form.ngayTao; // Lưu trữ giá trị ID hiện tại

        // Thiết lập lại các trường khác
        $scope.form = {
            nguoiTao: 'Admin', // Mặc định người tạo là 'Admin'
            nguoiCapNhat: 'Admin', // Mặc định người cập nhật là 'Admin'
            ngayTao: ngayTao, // Ngày tạo sẽ là thời gian hiện tại
            ngayCapNhat: new Date(), // Ngày cập nhật sẽ là thời gian hiện tại
            ten: '', // Đặt mặc định cho tên
            moTa: '', // Đặt mặc định cho mô tả
            trangThai: 1, // Đặt mặc định cho trạng thái là true
            id: currentId, // Giữ nguyên giá trị ID
            loai: "1" // Giữ nguyên giá trị ID
        };
    };
    $scope.resetAdd = function () {
        $scope.formAdd = {
            trangThai: "1", // Đặt mặc định cho trạng thái là true
            loai: "1" // Giữ nguyên giá trị ID
        };
    };

    $scope.edit = function (item) {
        // Chuyển timestamp thành Date object
        item.ngayCapNhat = new Date(item.ngayCapNhat);
        $scope.form = angular.copy(item);
    };

    $scope.update = function () {
        $scope.error = {
            ten: false,
            moTa: false,
            giaTri: false,
            ngayBatDau: false,
            ngayKetThuc: false,
        };

        // Kiểm tra các trường dữ liệu
        let isValid = true;

        // Kiểm tra tên không được để trống và phải có độ dài từ 1-100 ký tự
        if (!$scope.form.ten || $scope.form.ten.length < 1 || $scope.form.ten.length > 100) {
            $scope.error.ten = true;
            isValid = false;
        }

        // Kiểm tra mô tả không được để trống và phải có độ dài từ 1-100 ký tự
        if (!$scope.form.moTa || $scope.form.moTa.length < 1 || $scope.form.moTa.length > 100) {
            $scope.error.moTa = true;
            isValid = false;
        }

        // Kiểm tra giá trị không được bỏ trống và phải nằm trong khoảng từ 50,000 đến 1,000,000
        if (!$scope.form.giaTri || $scope.form.giaTri < 50000 || $scope.form.giaTri > 1000000) {
            $scope.error.giaTri = true;
            isValid = false;
        }

        // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
        if (!$scope.form.ngayBatDau || !$scope.form.ngayKetThuc || new Date($scope.form.ngayBatDau) >= new Date($scope.form.ngayKetThuc)) {
            $scope.error.ngayBatDau = true;
            $scope.error.ngayKetThuc = true;
            isValid = false;
        }

        // Nếu dữ liệu không hợp lệ, hiển thị thông báo và không thực hiện cập nhật
        if (!isValid) {
            swal("Lỗi!", "Vui lòng kiểm tra các trường dữ liệu và đảm bảo chúng hợp lệ.", "error");
            return; // Ngừng thực hiện nếu không hợp lệ
        }

        swal({
            title: "Xác nhận",
            text: "Bạn có chắc muốn cập nhật thương hiệu này không?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willUpdate) => {
            if (willUpdate) {
                var item = angular.copy($scope.form);
                item.ngayCapNhat = new Date(); // Chỉ cập nhật ngày sửa

                $http.put(`/rest/blog/${item.id}`, item).then(resp => {
                    $scope.initialize(); // Tải lại dữ liệu
                    swal("Success!", "Cập nhật thành công", "success");
                }).catch(error => {
                    swal("Error!", "Cập nhật thất bại", "error");
                    console.log("Error: ", error);
                });
            } else {
                swal("Hủy cập nhật", "Cập nhật thương hiệu đã bị hủy", "error");
            }
        });
    };

// Xóa thương hiệu
    $scope.delete = function (item) {
        swal({
            title: "Xác nhận",
            text: "Bạn có chắc muốn xóa thương hiệu này không?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willDelete) => {
            if (willDelete) {
                $http.delete(`/rest/blog/${item.id}`).then(resp => {
                    $scope.initialize(); // Tải lại dữ liệu
                    $scope.reset();
                    swal("Success!", "Xóa thành công", "success");
                }).catch(error => {
                    swal("Error!", "Xóa thất bại", "error");
                    console.log("Error: ", error);
                });
            } else {
                swal("Hủy xóa", "Xóa thương hiệu đã bị hủy", "error");
            }
        });
    };
    // Thêm thương hiệu
    $scope.create = function () {
        $scope.error1 = {
            ten: false,
            moTa: false,
            giaTri: false,
            ngayBatDau: false,
            ngayKetThuc: false,
            trangThai: false,
            loai: false,
        };

        // Kiểm tra các trường dữ liệu
        let isValid = true;

        // Kiểm tra tên không được để trống và phải có độ dài từ 1-100 ký tự
        if (!$scope.formAdd.ten || $scope.formAdd.ten.length < 1 || $scope.formAdd.ten.length > 100) {
            $scope.error1.ten = true;
            isValid = false;
        }

        // Kiểm tra mô tả không được để trống và phải có độ dài từ 1-100 ký tự
        if (!$scope.formAdd.moTa || $scope.formAdd.moTa.length < 1 || $scope.formAdd.moTa.length > 100) {
            $scope.error1.moTa = true;
            isValid = false;
        }

        // Kiểm tra giá trị không được bỏ trống và phải nằm trong khoảng từ 50,000 đến 1,000,000
        if (!$scope.formAdd.giaTri || $scope.formAdd.giaTri < 50000 || $scope.formAdd.giaTri > 1000000) {
            $scope.error1.giaTri = true;
            isValid = false;
        }

        if (!$scope.formAdd.trangThai) {
            $scope.error1.trangThai = true;
            isValid = false;
        }

        if (!$scope.formAdd.trangThai) {
            $scope.error1.loai = true;
            isValid = false;
        }

        // Kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
        if (!$scope.formAdd.ngayBatDau || !$scope.formAdd.ngayKetThuc || new Date($scope.formAdd.ngayBatDau) >= new Date($scope.formAdd.ngayKetThuc)) {
            $scope.error1.ngayBatDau = true;
            $scope.error1.ngayKetThuc = true;
            isValid = false;
        }

        // Nếu dữ liệu không hợp lệ, hiển thị thông báo và không thực hiện cập nhật
        if (!isValid) {
            swal("Lỗi!", "Vui lòng kiểm tra các trường dữ liệu và đảm bảo chúng hợp lệ.", "error");
            return; // Ngừng thực hiện nếu không hợp lệ
        }

        swal({
            title: "Xác nhận",
            text: "Bạn có chắc muốn thêm thương hiệu này không?",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        }).then((willAdd) => {
            if (willAdd) {
                var item = angular.copy($scope.formAdd);
                item.nguoiTao = 'Admin'; // Đặt người tạo mặc định là 'Admin'
                item.ngayTao = new Date(); // Ngày tạo là thời gian hiện tại
                item.ngayCapNhat = new Date(); // Ngày cập nhật là thời gian hiện tại
                $http.post(`/rest/blog`, item).then(resp => {
                    $scope.initialize(); // Tải lại dữ liệu
                    $scope.resetAdd();
                    swal("Success!", "Thêm mới thành công", "success");
                }).catch(error => {
                    swal("Error!", "Thêm mới thất bại", "error");
                    console.log("Error: ", error);
                });
            } else {
                swal("Hủy thêm thương hiệu", "Thêm thương hiệu đã bị hủy", "error");
            }
        });
    };

});
