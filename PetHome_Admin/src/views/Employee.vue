<template>
  <section>
    <!--工具条-->
    <el-col :span="24" class="toolbar" style="padding-bottom: 0px;">
      <el-form :inline="true" :model="filters">
        <el-form-item>
          <el-input v-model="filters.keyword" placeholder="请输入用户名或邮箱关键字"></el-input>
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-search" size="mini" type="primary" v-on:click="searchData">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button icon="el-icon-plus" size="mini" type="primary" @click="showAddDialog">新增</el-button>
        </el-form-item>
      </el-form>
    </el-col>

    <!--列表-->
    <el-table :data="tableData" highlight-current-row v-loading="listLoading" @selection-change="selsChange"
              style="width: 100%;">
      <el-table-column type="selection" width="55">
      </el-table-column>
      <el-table-column prop="id" label="ID" sortable>
      </el-table-column>
      <el-table-column prop="username" label="用户名" sortable>
      </el-table-column>
      <el-table-column prop="email" label="邮箱" sortable>
      </el-table-column>
      <el-table-column prop="age" label="年龄" sortable>
      </el-table-column>
      <el-table-column prop="state" label="状态" :formatter="formatState" sortable>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template scope="scope">
          <el-button type="primary" size="mini" icon="el-icon-edit" @click="showEditDialog(scope.$index, scope.row)">
            编辑
          </el-button>
          <el-button type="danger" icon="el-icon-delete" size="mini" @click="deleteSubmit(scope.$index, scope.row)">删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!--工具条-->
    <el-col :span="24" class="toolbar">
      <el-button type="danger" @click="batchRemove" :disabled="this.sels.length===0">批量删除</el-button>
      <el-pagination layout="prev, pager, next" @current-change="handleCurrentChange" :page-size="pageSize" :total="total"
                     style="float:right;">
      </el-pagination>
    </el-col>

    <!--新增、编辑界面-->
    <el-dialog title="新增/编辑" :visible.sync="addDialogVisible" :close-on-click-modal="false">
      <el-form :model="addForm" label-width="80px" :rules="addFormRules" ref="addForm">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addForm.username" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addForm.email" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addForm.password" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="电话" prop="phone">
          <el-input v-model="addForm.phone" auto-complete="off"></el-input>
        </el-form-item>
        <el-form-item label="年龄" prop="age">
          <el-input v-model="addForm.age" auto-complete="off"></el-input>
        </el-form-item>

        <el-form-item label="状态" prop="state">
          <el-radio v-model="radio.state" label="0">正常</el-radio>
          <el-radio v-model="radio.state" label="1">禁用</el-radio>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click.native="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click.native="addSubmit" :loading="addLoading">提交</el-button>
      </div>
    </el-dialog>


  </section>
</template>

<script>
import util from '../common/js/util'
//import NProgress from 'nprogress'
import {getUserListPage, removeUser, batchRemoveUser, editUser, addUser} from '../api/api';

export default {
  data() {
    return {
      /*表单*/
      filters: {
        /*关键词搜索*/
        keyword: ''
      },
      /*表格*/
      tableData: [],
      total: 0,
      page: 1,
      pageSize: 10,
      listLoading: false,
      //列表选中列
      sels: [],

      //弹窗界面是否显示
      addDialogVisible: false,
      addLoading: false,
      addFormRules: {
        username: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 2, max: 16, message: '长度在 2 到 16 个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 8, max: 26, message: '长度在 8 到 26 个字符', trigger: 'blur'}
        ],
        email: [
          {required: true, message: '请输入邮箱', trigger: 'blur'},
          {min: 2, max: 60, message: '长度在 2 到 60 个字符', trigger: 'blur'},
          {type:'email',message: '邮箱格式不正确，请输入Example@exp.com', trigger: 'blur' }
        ],
        phone: [
          {message: '请输入电话', trigger: 'blur'},
          {type:'number',message: '电话格式不正确', trigger: 'blur' }
        ],
        age: [
          {message: '请输入年龄', trigger: 'blur'},
          {min: 1,max: 3,  message: '长度在 1 到 3 个字符', trigger: 'blur'},
        ],
      },
      //新增界面数据
      addForm: {
        id: "",
        username: "",
        email: "",
        phone: "",
        age: "",
        password:"",
        state: ""
      },
      radio: {
        state: "1"
      },
    }
  },
  methods: {
    formatState: function (row, column) {
      return row.state == 0 ? '正常使用' : row.state == 1 ? '注销' : '未知情况';
    },
    //选择页码
    handleCurrentChange(val) {
      this.page = val;
      this.getTableData();
    },
    /**
     * 高级查询
     */
    searchData(){
        this.page=1;
        this.getTableData();
    },

    /**
     * 用户表和高级查询
     */
    //获取用户列表
    getTableData() {
      let para = {
        //当前页
        page: this.page,
        //高级查询
        keyword: this.filters.keyword
      };

      //打开加载动画
      this.listLoading = true;
      /*分页*/
      this.$http.post("/employee/page",para).then(res => {
        console.debug("res="+res);

        let {success, message, code, data} = res.data;
        console.debug("resdata="+res.data);

        if (success) {
          //总条数
          this.total = data.total;
          console.debug("数据",data.total)
          console.debug("数据",data.list)
          //表数据
          this.tableData = data.list;

        } else {
          this.$message.error(message)
        }
        //关闭加载动画
        this.listLoading = false;
      }).catch(error => {
        //关闭加载动画
        this.listLoading = false;
        this.$message.error(error.message);
      });
    },


    //删除方法
    deleteSubmit: function (index, row) {

      this.$confirm('确认删除该记录吗?', '提示', {
        type: 'warning'

      }).then(() => {
        this.listLoading = true;
        this.$http.delete("/employee/" + row.id, {}).then(res => {
          let {success, messsage} = res.data;
          if (success) {
            this.$message.success("删除成功");
            this.getTableData();
          } else {
            this.$message.error(messsage);
          }
          this.listLoading = false;
        }).catch(error => {
          this.listLoading = false;
          this.$message.error(error.messsage);
        })
      });
    },

    //显示编辑界面
    showEditDialog: function (index, row) {
      //回显
      //一个row其实代表一个部门对象，里面是关联对象  row.manager, 和 row.parent
      //拉下和级联 v-model=“addForm.managerId” 所以要转一下
      this.addForm = Object.assign({}, row);
      //和添加使用同一个弹窗
      this.addDialogVisible = true;
    },



    //显示新增界面
    showAddDialog: function () {

      for (let pro in this.addForm) {
        //清空表单
        this.addForm[pro] = "";
      }

      //显示添加弹窗
      this.addDialogVisible = true;
    },

    //新增,编辑提交
    addSubmit: function () {
      //表单校验
      this.$refs.addForm.validate((valid) => {
        if (valid) {
          //表单校验成功
          this.$confirm('确认提交吗？', '提示', {}).then(() => {
            //加载动画
            this.addLoading = true;
            //克隆
            let para = Object.assign({}, this.addForm);

            if(para.parentId && para.parentId.length > 0){
              para.parentId = para.parentId[para.parentId.length -1 ];
            }

            //如果para有ID就是修改，没有就是新增

            let method = "post";/*新增用post请求*/

            /*有id用put*/
            if (para.id) {
              console.debug("paraid"+para.id)

              method = "put";
              console.debug("para"+para)
            }

            console.debug(method)

            //发送不同命令实现
            this.$http[method]("/employee", para).then(res => {

              console.debug("resdata="+res.data)
              let {success, message} = res.data;

              if (success) {
                this.$message.success(message);
                //隐藏弹窗
                this.addDialogVisible = false;
                //加载列表
                this.getTableData();
              } else {
                this.$message.error(message)
              }
              this.addLoading = false;
            }).catch(error => {
              this.$message.error(error.message);
              this.addLoading = false;
            });
          });
        }
      });
    },
    selsChange: function (sels) {
      this.sels = sels;
    },
    //批量删除
    batchRemove: function () {
      //获取选中的行的ID数组
      var ids = this.sels.map(item => item.id);

      this.$confirm('你确定删除吗？', '提示', {
        type: 'warning'
      }).then(() => {
        this.listLoading = true;
        let para = { ids: ids };
        this.$http.delete("/employee/multiple",{data:para}).then(res=>{
          let {success , message} = res.data;
          if(success){
            this.$message.success("删除成功");
            this.getTableData();
          }else{
            this.$message.error(message);
          }
          this.listLoading = false;
        }).catch(error => {
          this.listLoading = false;
          this.$message.error(error.message);
        });
      });
    },
  },
  mounted() {
    this.getTableData();
  }
}

</script>

<style scoped>

</style>